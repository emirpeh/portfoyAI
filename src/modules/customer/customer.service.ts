import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, Prisma } from '@prisma/client';
import type { EmailAnalysisCustomer } from '../gpt/schemas/real-estate-email-analysis.schema';

// CustomerType enum değerlerini emlak sektörüne uygun olarak tanımlıyoruz
export enum CustomerType {
  BUYER = 'BUYER',
  SELLER = 'SELLER', 
  BOTH = 'BOTH',
  UNKNOWN = 'UNKNOWN',
}

// Müşteri mail listesi için tip tanımı
interface CustomerMailListInterface {
  id: number;
  customerId: number;
  mail: string;
  isSend: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// Veritabanı şemasına uygun müşteri tipi tanımlaması
interface ExtendedCustomer extends Omit<Customer, 'customerType'> {
  customerType: CustomerType | string;
  externalId?: string;
}

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  async getCustomerByExternalId(externalId: string): Promise<ExtendedCustomer | null> {
    this.logger.debug(`getCustomerByExternalId (Prisma) çağrıldı: externalId=${externalId}`);
    if (!externalId) {
      this.logger.warn(`getCustomerByExternalId (Prisma): externalId parametresi boş geldi.`);
      return null;
    }
    try {
      // 1. externalId'yi içeren CustomerMailList kaydını bul
      const mailRecord = await this.prisma.customerMailList.findFirst({
        where: {
          mail: `externalId:${externalId}`,
          // isSend: false, // Bu kayıtlar externalId saklamak için, isSend durumu önemli değil
        },
        select: {
          customerId: true,
        },
      });

      if (!mailRecord || mailRecord.customerId === null) {
        this.logger.log(
          `getCustomerByExternalId (Prisma): ExternalId '${externalId}' ile eşleşen CustomerMailList kaydı bulunamadı veya customerId null.`,
        );
        return null;
      }

      const customerId = mailRecord.customerId;

      // 2. customerId ile asıl Customer kaydını çek
      const customer = await this.prisma.customer.findUnique({
        where: {
          id: customerId,
        },
      });

      if (!customer) {
        this.logger.warn(
          `getCustomerByExternalId (Prisma): CustomerId '${customerId}' (externalId: ${externalId} için) ile müşteri bulunamadı.`,
        );
        return null;
      }

      // 3. ExtendedCustomer formatında döndür
      this.logger.debug(
        `getCustomerByExternalId (Prisma): Müşteri bulundu: ID=${customer.id}, ExternalID=${externalId}`,
      );
      return {
        ...customer, // Customer modelinden gelen tüm alanlar
        customerType: customer.customerType as CustomerType, // Prisma'dan gelen string, enum ile uyumlu olmalı
        externalId: externalId, // Aranan externalId
      };
    } catch (error) {
      this.logger.error(
        `getCustomerByExternalId (Prisma) sırasında hata: externalId=${externalId}, Hata: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async createCustomerAuth(userId: string, externalId?: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // userId string olduğu için number'a çeviriyoruz
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      throw new NotFoundException('Invalid user ID');
    }

    // Temel müşteri verilerini oluşturuyoruz
    const createdCustomer = await this.prisma.customer.create({
      data: {
        userId: numericUserId,
        name: user.name || 'Müşteri',
        email: user.email,
        customerType: CustomerType.BUYER,
      },
      include: { user: true },
    });

    // ExternalId alanını işlemek için ayrı bir işlem yapıyoruz
    if (externalId) {
      // ExternalId'yi bir özel tabloda veya ayarda saklayabilirsiniz
      // Burada örnek olarak, bunu bir log veya geçici bir değer olarak saklıyoruz
      await this.storeExternalId(createdCustomer.id, externalId);
    }

    return createdCustomer;
  }

  // ExternalId'yi saklamak için yardımcı metod
  private async storeExternalId(customerId: number, externalId: string) {
    try {
      // Bu örnek metod externalId'yi saklamak için kullanılabilir
      // Örneğin CustomerMailList tablosuna bir not olarak ekleyebiliriz
      await this.prisma.customerMailList.create({
        data: {
          customerId: customerId,
          mail: `externalId:${externalId}`,  // ExternalId'yi bu şekilde saklayabilirsiniz
          isSend: false,  // Bu e-posta gönderilmeyecek, sadece bir not
        }
      });
      
      console.log(`ExternalId ${externalId} saklandı: Müşteri ID ${customerId}`);
    } catch (error) {
      console.error('ExternalId saklanırken hata oluştu:', error);
    }
  }

  // ExternalId'yi getirmek için yardımcı metod
  private async getStoredExternalId(customerId: number): Promise<string | null> {
    try {
      const record = await this.prisma.customerMailList.findFirst({
        where: {
          customerId: customerId,
          mail: { startsWith: 'externalId:' }
        }
      });
      
      if (!record) return null;
      
      // 'externalId:' kısmını çıkartıp sadece değeri döndür
      return record.mail.replace('externalId:', '');
    } catch (error) {
      console.error('ExternalId alınırken hata oluştu:', error);
      return null;
    }
  }

  async createCustomer(externalId?: string) {
    try {
      // Temel müşteri verilerini oluşturuyoruz
      const newCustomer = await this.prisma.customer.create({
        data: {
          name: `Müşteri ${Date.now()}`,
          email: `customer_${Date.now()}@portfolioai.com`,
          customerType: CustomerType.BUYER,
        },
      });

      // ExternalId varsa, onu ayrıca saklıyoruz
      if (externalId) {
        await this.storeExternalId(newCustomer.id, externalId);
      }

      console.log('Yeni müşteri oluşturuldu:', newCustomer);
      return newCustomer;
    } catch (error) {
      console.error('Müşteri oluşturma hatası:', error);
      throw error;
    }
  }

  async findByUserId(userId: string) {
    // userId string olduğu için number'a çeviriyoruz
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        userId: numericUserId,
      },
      include: { user: true },
    });

    if (customer) {
      // Eğer müşteri bulunduysa, externalId'yi de getiriyoruz
      const externalId = await this.getStoredExternalId(customer.id);
      
      // Müşteri nesnesine externalId'yi ekliyoruz
      return {
        ...customer,
        externalId
      };
    }

    return customer;
  }

  async updateCustomerByUserId(userId: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findByUserId(userId);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // DTO'dan sadece geçerli alanları çıkarıyoruz
    const { name, email, phone, company, customerType, externalId } = updateCustomerDto;
    const validData: any = {};
    
    if (name) validData.name = name;
    if (email) validData.email = email;
    if (phone) validData.phone = phone;
    if (company) validData.company = company;
    if (customerType) validData.customerType = customerType;

    // Temel müşteri verilerini güncelliyoruz
    const updatedCustomer = await this.prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: validData,
      include: { user: true },
    });

    // ExternalId varsa, onu da güncelliyoruz
    if (externalId) {
      await this.storeExternalId(customer.id, externalId);
    }

    // customer.externalId değerini güvenli bir şekilde alma
    const customerExternalId = typeof customer === 'object' && customer !== null && 'externalId' in customer
      ? (customer as any).externalId
      : null;

    // Güncellenmiş müşteri ve externalId'yi döndürüyoruz
    return {
      ...updatedCustomer,
      externalId: externalId || customerExternalId
    };
  }

  async getCustomerMailList(customerId: number): Promise<CustomerMailListInterface[]> {
    return await this.prisma.customerMailList.findMany({
      where: {
        customerId,
        // Sadece gönderilecek mailleri değil, tüm kayıtları getirmeli (externalId içerenler dahil)
        // isSend: true, 
      },
    }) as CustomerMailListInterface[];
  }

  async createBulkCustomerMailList(
    externalId: string,
    mails: Array<{ mail: string; isSend: boolean }>,
  ) {
    this.logger.debug(
      `createBulkCustomerMailList çağrıldı: externalId=${externalId}`,
    );
    // Artık Prisma tabanlı getCustomerByExternalId çağrılıyor
    let customer = await this.getCustomerByExternalId(externalId); 

    if (!customer) {
      this.logger.warn(
        `createBulkCustomerMailList: externalId ${externalId} ile müşteri bulunamadı. Bu externalId için yeni bir müşteri oluşturulmayacak. İşlem devam etmiyor.`,
      );
      // TODO: externalId ile müşteri bulunamazsa nasıl bir yol izlenmeli? 
      // Belki de burada createCustomer çağrılmalı ve externalId onunla ilişkilendirilmeli.
      // Şimdilik, eğer externalId ile müşteri yoksa, mail listesi oluşturmuyoruz.
      return []; 
    }

    const customerId = customer.id;
    const createdMails: CustomerMailListInterface[] = []; // Tip adını düzelttim

    for (const mailInfo of mails) {
      try {
        // Aynı customerId ve mail için zaten kayıt var mı diye kontrol et (isSend durumu farklı olabilir)
        const existingMail = await this.prisma.customerMailList.findFirst({
          where: {
            customerId: customerId,
            mail: mailInfo.mail,
          }
        });

        if (existingMail) {
          // Eğer kayıt varsa ve isSend durumu farklıysa güncelle, değilse dokunma
          if (existingMail.isSend !== mailInfo.isSend) {
            const updatedMail = await this.prisma.customerMailList.update({
              where: { id: existingMail.id },
              data: { isSend: mailInfo.isSend },
            });
            createdMails.push(updatedMail as CustomerMailListInterface); // Tip adını düzelttim
          } else {
            // Durum aynıysa mevcut kaydı listeye ekle (veya ekleme, duruma göre)
             createdMails.push(existingMail as CustomerMailListInterface); // Tip adını düzelttim
          }
        } else {
          // Kayıt yoksa yeni oluştur
          const newMail = await this.prisma.customerMailList.create({
            data: {
              customerId: customerId,
              mail: mailInfo.mail,
              isSend: mailInfo.isSend,
            },
          });
          createdMails.push(newMail as CustomerMailListInterface); // Tip adını düzelttim
        }
      } catch (error) {
        this.logger.error(
          `Error creating/updating mail ${mailInfo.mail} for customer ${customerId} (externalId: ${externalId}): ${error.message}`,
          error.stack,
        );
      }
    }
    return createdMails;
  }

  async getCustomerContact(mail: string) {
    // Örnek bir çözüm: Customer'ı mail ile doğrudan bağlayalım
    const customer = await this.prisma.customer.findFirst({
      where: {
        email: mail,
      },
    });

    // Bulunamadıysa, CustomerMailList tablosunda arayalım
    if (!customer) {
      const mailRecord = await this.prisma.customerMailList.findFirst({
        where: {
          mail,
        },
      });

      if (mailRecord) {
        // Eğer mail kaydı bulunduysa, müşteriyi ID ile alalım
        const associatedCustomer = await this.prisma.customer.findUnique({
          where: {
            id: mailRecord.customerId,
          },
        });

        return {
          mail,
          customer: associatedCustomer,
        };
      }
    }

    // Eğer doğrudan müşteri bulunduysa
    if (customer) {
      return {
        mail,
        customer,
      };
    }

    return null;
  }

  // Emlak portalı için uyarlanmış metod: ID'ye göre e-posta tercihi oluşturma
  async createCustomerMail(customerId: string, mail: string, isSend: boolean) {
    // customerId'yi sayıya dönüştür
    const numericId = parseInt(customerId, 10);
    
    let customer = await this.findById(numericId);
    if (!customer) {
      throw new NotFoundException('Müşteri bulunamadı');
    }

    const existingMail = await this.prisma.customerMailList.findFirst({
      where: {
        customerId: customer.id,
        mail,
      },
    });

    if (existingMail) {
      return await this.prisma.customerMailList.update({
        where: {
          id: existingMail.id,
        },
        data: {
          isSend,
        },
      });
    }

    return await this.prisma.customerMailList.create({
      data: {
        customerId: customer.id,
        mail,
        isSend,
      },
    });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    name: string;
    customerType: CustomerType;
    phone?: string;
    company?: string;
  }): Promise<Customer> {
    this.logger.log(`Yeni müşteri manuel olarak oluşturuluyor: ${data.email}`);
    return this.prisma.customer.create({
      data: {
        ...data,
        customerType: data.customerType.toString(), // Enum ise stringe çevir
      },
    });
  }

  async findById(id: number): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async updateCustomer(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      customerType?: CustomerType;
      externalId?: string;
    },
  ): Promise<Customer> {
    // id'yi sayıya dönüştür
    const numericId = parseInt(id, 10);
    
    const customer = await this.findById(numericId);
    if (!customer) {
      throw new NotFoundException('Müşteri bulunamadı');
    }

    // externalId'yi veri nesnesinden çıkartıyoruz
    const { externalId, ...updateData } = data;

    // Temel müşteri verilerini güncelliyoruz
    const updatedCustomer = await this.prisma.customer.update({
      where: { id: numericId },
      data: updateData,
    });

    // ExternalId varsa, onu da güncelliyoruz
    if (externalId) {
      await this.storeExternalId(numericId, externalId);
    }

    // Güncellenmiş müşteri ve externalId'yi döndürüyoruz
    return {
      ...updatedCustomer,
      externalId: externalId || (customer as any).externalId
    } as any;
  }

  // Tüm müşterileri bulma
  async findAll(options?: {
    customerType?: CustomerType;
    skip?: number;
    take?: number;
  }): Promise<{ customers: Customer[]; total: number }> {
    const { customerType, skip = 0, take = 10 } = options || {};

    const where: any = {};
    if (customerType) {
      where.customerType = customerType;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    // Tüm müşteriler için externalId bilgisini getiriyoruz
    const customersWithExternalId = await Promise.all(
      customers.map(async (customer) => {
        const externalId = await this.getStoredExternalId(customer.id);
        return {
          ...customer,
          externalId
        };
      })
    );

    return { customers: customersWithExternalId as any, total };
  }

  // Müşteri silme
  async delete(id: number): Promise<Customer> {
    const customer = await this.findById(id);
    if (!customer) {
      throw new NotFoundException('Müşteri bulunamadı');
    }

    return await this.prisma.customer.delete({
      where: { id },
    });
  }

  // Alıcıları bulma
  async findBuyers(options?: {
    skip?: number;
    take?: number;
  }): Promise<{ buyers: Customer[]; total: number }> {
    const { skip = 0, take = 10 } = options || {};

    const where = { customerType: CustomerType.BUYER };

    const [buyers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    // Tüm alıcılar için externalId bilgisini getiriyoruz
    const buyersWithExternalId = await Promise.all(
      buyers.map(async (buyer) => {
        const externalId = await this.getStoredExternalId(buyer.id);
        return {
          ...buyer,
          externalId
        };
      })
    );

    return { buyers: buyersWithExternalId as any, total };
  }

  // Satıcıları bulma
  async findSellers(options?: {
    skip?: number;
    take?: number;
  }): Promise<{ sellers: Customer[]; total: number }> {
    const { skip = 0, take = 10 } = options || {};

    const where = { customerType: CustomerType.SELLER };

    const [sellers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    // Tüm satıcılar için externalId bilgisini getiriyoruz
    const sellersWithExternalId = await Promise.all(
      sellers.map(async (seller) => {
        const externalId = await this.getStoredExternalId(seller.id);
        return {
          ...seller,
          externalId
        };
      })
    );

    return { sellers: sellersWithExternalId as any, total };
  }

  async getActiveSearchRequestId(customerId: number): Promise<number | undefined> {
    if (isNaN(customerId)) {
      this.logger.warn('getActiveSearchRequestId called with invalid customerId (NaN)');
      return undefined;
    }
    try {
      const searchRequest = await this.prisma.propertySearchRequest.findFirst({
        where: {
          customerId: customerId,
          status: 'ACTIVE', // Aktif olma durumunu Prisma şemasındaki enum/string değerine göre ayarlayın
        },
        select: {
          id: true,
        },
        orderBy: {
          createdAt: 'desc', // En son aktif olanı almak mantıklı olabilir
        },
      });
      return searchRequest?.id;
    } catch (error) {
      this.logger.error(`Error fetching active search request ID for customer ${customerId}: ${error.message}`, error.stack);
      return undefined;
    }
  }

  async findOrCreateCustomerFromAnalysis(
    analysisCustomer: EmailAnalysisCustomer | null,
    fromEmail: string,
  ): Promise<Customer | null> {
    if (!analysisCustomer && !fromEmail) {
      this.logger.warn(
        'findOrCreateCustomerFromAnalysis: Hem analiz müşteri bilgisi hem de gönderen e-postası boş.',
      );
      return null;
    }

    const emailToSearch = fromEmail;
    this.logger.log(
      `Müşteri aranıyor/oluşturuluyor: E-posta - ${emailToSearch}, Analizdeki müşteri - ${analysisCustomer?.name}`,
    );

    try {
      let customer = await this.prisma.customer.findUnique({
        where: { email: emailToSearch },
      });

      if (customer) {
        this.logger.log(`Mevcut müşteri bulundu: ${customer.id} - ${customer.email}`);
        // Opsiyonel: Müşteri bilgilerini analizden gelenle güncelle
        const updateData: Prisma.CustomerUpdateInput = {};
        if (analysisCustomer?.name && !customer.name) {
          updateData.name = analysisCustomer.name;
        }
        if (analysisCustomer?.phone && !customer.phone) {
          updateData.phone = analysisCustomer.phone;
        }
        // CustomerType sadece UNKNOWN ise veya analizdeki daha spesifik ise güncelle
        if (
          analysisCustomer?.customerType &&
          (customer.customerType === CustomerType.UNKNOWN ||
            (customer.customerType !== CustomerType.BOTH && 
             customer.customerType !== analysisCustomer.customerType))
        ) {
          // Eğer mevcut tip SELLER ve analizden BUYER geliyorsa BOTH yapabiliriz, veya tersi.
          // Şimdilik basitçe analizden gelenle değiştirelim, daha karmaşık mantık eklenebilir.
          updateData.customerType = analysisCustomer.customerType;
        }

        if (Object.keys(updateData).length > 0) {
          customer = await this.prisma.customer.update({
            where: { id: customer.id },
            data: updateData,
          });
          this.logger.log(`Müşteri bilgileri güncellendi: ${customer.id}`);
        }
        return customer;
      } else {
        this.logger.log(`Mevcut müşteri bulunamadı, yeni müşteri oluşturuluyor: ${emailToSearch}`);
        const newCustomerData: Prisma.CustomerCreateInput = {
          email: emailToSearch,
          name: analysisCustomer?.name || 'Yeni Müşteri (E-postadan)', // Varsayılan isim
          phone: analysisCustomer?.phone,
          customerType: analysisCustomer?.customerType || CustomerType.UNKNOWN,
          // user: {} // Eğer bir User ile ilişkilendirilecekse burası doldurulmalı
        };

        customer = await this.prisma.customer.create({
          data: newCustomerData,
        });
        this.logger.log(`Yeni müşteri oluşturuldu: ${customer.id} - ${customer.email}`);
        return customer;
      }
    } catch (error) {
      this.logger.error(
        `Müşteri bulunurken/oluşturulurken hata: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
