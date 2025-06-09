import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
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

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    private database: DatabaseService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) { }

  async create(data: {
    email: string;
    name: string;
    customerType: CustomerType;
    phone?: string;
    company?: string;
  }): Promise<Customer> {
    this.logger.log(`Yeni müşteri manuel olarak oluşturuluyor: ${data.email}`);
    return this.database.customer.create({
      data: {
        ...data,
        customerType: data.customerType.toString(),
      },
    });
  }

  async createCustomerAuth(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.database.customer.create({
      data: {
        userId: userId,
        name: user.name || 'Müşteri',
        email: user.email,
        customerType: CustomerType.BUYER,
      },
      include: { user: true },
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.database.customer.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.database.customer.findUnique({ where: { email } });
  }

  async findByUserId(userId: string): Promise<Customer | null> {
    this.logger.log(`Finding customer for user ID: ${userId}`);
    const customer = await this.database.customer.findFirst({
      where: { userId: userId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findAll(options?: {
    name?: string;
    email?: string;
    customerType?: CustomerType | CustomerType[];
    limit?: number;
    offset?: number;
  }) {
    const {
      limit = 10,
      offset = 0,
      name,
      email,
      customerType,
    } = options || {};

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null, // Sadece aktif (silinmemiş) müşterileri getir
    };

    if (name) {
      where.name = { contains: name };
    }
    if (email) {
      where.email = { contains: email };
    }
    if (customerType) {
      if (Array.isArray(customerType)) {
        where.customerType = { in: customerType };
      } else {
        where.customerType = customerType;
      }
    }

    const [total, data] = await this.database.$transaction([
      this.database.customer.count({ where }),
      this.database.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: +limit,
        skip: +offset,
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    try {
      return await this.database.customer.update({
        where: { id },
        data: updateCustomerDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Customer with id ${id} not found`);
      }
      throw new InternalServerErrorException(
        'An error occurred while updating the customer.',
      );
    }
  }

  async updateCustomerByUserId(
    userId: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findByUserId(userId);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const { name, email, phone, company, customerType } = updateCustomerDto;
    const validData: Prisma.CustomerUpdateInput = {};

    if (name) validData.name = name;
    if (email) validData.email = email;
    if (phone) validData.phone = phone;
    if (company) validData.company = company;
    if (customerType) validData.customerType = customerType;

    return this.database.customer.update({
      where: {
        id: customer.id,
      },
      data: validData,
      include: { user: true },
    });
  }

  async remove(id: string): Promise<Customer> {
    try {
      return await this.database.customer.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Customer with id ${id} not found`);
      }
      throw new InternalServerErrorException(
        'An error occurred while deleting the customer.',
      );
    }
  }

  async getActiveSearchRequestId(
    customerId: string,
  ): Promise<string | undefined> {
    if (!customerId) {
      throw new NotFoundException('Müsteri ID si boş olamaz');
    }

    const searchRequest = await this.database.propertySearchRequest.findFirst({
      where: {
        customerId: customerId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });
    return searchRequest?.id;
  }

  async findOrCreateCustomerFromAnalysis(
    analysisCustomer: EmailAnalysisCustomer | null,
    fromEmail: string,
    customerType: CustomerType = CustomerType.UNKNOWN,
    formName?: string,
  ): Promise<Customer | null> {
    if (!fromEmail) {
      this.logger.error(
        'findOrCreateCustomerFromAnalysis çağrıldı, ancak fromEmail boş.',
      );
      return null;
    }

    this.logger.log(`Müşteri aranıyor veya oluşturuluyor: ${fromEmail}`);

    const existingCustomer = await this.findByEmail(fromEmail);
    if (existingCustomer) {
      this.logger.log(`Mevcut müşteri bulundu: ${fromEmail}`);
      const newName = formName || analysisCustomer?.name;
      const newPhone = analysisCustomer?.phone;

      const updateData: Prisma.CustomerUpdateInput = {};
      let needsUpdate = false;

      if (newName && existingCustomer.name !== newName) {
        this.logger.log(`Müşteri ismi güncelleniyor. Eski: ${existingCustomer.name}, Yeni: ${newName}`);
        updateData.name = newName;
        needsUpdate = true;
      }

      if (newPhone && existingCustomer.phone !== newPhone) {
        this.logger.log(`Müşteri telefonu güncelleniyor. Eski: ${existingCustomer.phone}, Yeni: ${newPhone}`);
        updateData.phone = newPhone;
        needsUpdate = true;
      }

      if (needsUpdate) {
        return this.database.customer.update({
          where: { id: existingCustomer.id },
          data: updateData,
        });
      }

      return existingCustomer;
    }

    this.logger.log(`Yeni müşteri için kayıt oluşturuluyor: ${fromEmail}`);

    try {
      const customerData = {
        email: fromEmail,
        name: formName || analysisCustomer?.name || fromEmail.split('@')[0],
        phone: analysisCustomer?.phone || null,
        customerType: customerType,
      };

      const newCustomer = await this.database.customer.create({
        data: customerData,
      });

      this.logger.log(
        `Yeni müşteri başarıyla oluşturuldu: ${newCustomer.email}`,
      );
      return newCustomer;
    } catch (error) {
      this.logger.error(
        `Müşteri oluşturulurken hata: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
