import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { DatabaseService } from '../database/database.service';
@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private databaseService: DatabaseService,
  ) {}

  async getCustomers(offset: number, limit: number, companyName?: string) {
    const request = this.databaseService.getPool().request();

    request.input('offset', offset);
    request.input('limit', limit);

    if (companyName) {
      request.input('companyName', `%${companyName}%`);
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM MUSTTABLE
      WHERE SorunluMus = 0
      ${companyName ? 'AND FIRMA_ADI LIKE @companyName' : ''}
    `;

    const countResult = await request.query(countQuery);
    const total = countResult.recordset[0].total;

    let query = `
      SELECT 
        CAST(FIRMA_NO AS VARCHAR) AS id,
        RTRIM(FIRMA_ADI) AS company,
        RTRIM(VERGI_D) AS taxOffice,
        RTRIM(V_HESNO) AS taxValue,
        RTRIM(DOVAD) AS currency,
        RTRIM(ULKE) AS country,
        RTRIM(IL) AS city,
        RTRIM(ILCE) AS district
      FROM MUSTTABLE
      WHERE SorunluMus = 0
      ${companyName ? 'AND FIRMA_ADI LIKE @companyName' : ''}
    `;

    query += `
      ORDER BY FIRMA_NO
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const result = await request.query(query);

    const customers = await this.userService.getUsersByExternalId(
      result.recordset.map(customer => customer.id),
    );

    const data = result.recordset.map(customer => {
      const user = customers.find(u => u.externalId === customer.id && u.user);
      return {
        accountId: user?.userId,
        ...customer,
      };
    });

    return {
      data,
      total,
    };
  }

  async getCustomerByExternalId(externalId: string) {
    return await this.prisma.customer.findFirst({
      where: {
        externalId,
      },
    });
  }

  async createCustomerAuth(userId: string, externalId?: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.prisma.customer.create({
      data: {
        userId,
        externalId,
      },
      include: { user: true },
    });
  }

  async createCustomer(externalId?: string) {
    try {
      const newCustomer = await this.prisma.customer.create({
        data: {
          externalId,
        },
      });

      console.log('Created new customer:', newCustomer);
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async findByUserId(userId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        userId,
      },
      include: { user: true },
    });

    return customer;
  }

  async update(userId: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findByUserId(userId);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return await this.prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: updateCustomerDto,
      include: { user: true },
    });
  }

  async getCustomerExternalMailList(externalId: number) {
    const request = this.databaseService.getPool().request();

    request.input('Firma_No', externalId);

    const query = `
      SELECT 
        RTRIM(Firma_No) as companyNo,
        RTRIM(Yetkili_Adi) as name,
        RTRIM(CepTel) as phone,
        RTRIM(Email) as email
      FROM MUSTTABLE_Yetkili
      WHERE Firma_No = @Firma_No
    `;

    const result = await request.query(query);
    const customer = await this.getCustomerByExternalId(externalId.toString());
    let customerMailList = [];
    if (customer) {
      customerMailList = await this.getCustomerMailList(customer.id);
    }
    return result.recordset.map(item => ({
      ...item,
      isSend: customerMailList.filter(mail => mail.mail === item.email)[0]
        ?.isSend,
    }));
  }

  async getCustomerMailList(customerId: number) {
    return await this.prisma.customerMailList.findMany({
      where: {
        customerId,
      },
    });
  }

  async createBulkCustomerMailList(
    externalId: string,
    mails: Array<{ mail: string; isSend: boolean }>,
  ) {
    let customer = await this.getCustomerByExternalId(externalId);
    if (!customer) {
      const newCustomer = await this.createCustomer(externalId);
      customer = newCustomer;
    }

    const existingMails = await this.prisma.customerMailList.findMany({
      where: {
        customerId: customer.id,
        deletedAt: null,
      },
      select: {
        mail: true,
      },
    });

    const existingMailSet = new Set(existingMails.map(m => m.mail));

    // Process each mail individually
    for (const mail of mails) {
      if (!existingMailSet.has(mail.mail)) {
        await this.prisma.customerMailList.create({
          data: {
            customerId: customer.id,
            mail: mail.mail,
            isSend: mail.isSend,
          },
        });
      } else {
        // Update existing mail's isSend status
        await this.prisma.customerMailList.updateMany({
          where: {
            customerId: customer.id,
            mail: mail.mail,
            deletedAt: null,
          },
          data: {
            isSend: mail.isSend,
          },
        });
      }
    }

    return await this.prisma.customerMailList.findMany({
      where: {
        customerId: customer.id,
        deletedAt: null,
      },
    });
  }

  async getCustomerContact(mail: string) {
    return await this.prisma.customerMailList.findFirst({
      where: {
        mail,
      },
    });
  }

  async createCustomerMail(externalId: string, mail: string, isSend: boolean) {
    let customer = await this.getCustomerByExternalId(externalId);
    if (!customer) {
      const newCustomer = await this.createCustomer(externalId);
      customer = newCustomer;
    }

    const existingMail = await this.prisma.customerMailList.findFirst({
      where: {
        customerId: customer.id,
        mail,
        deletedAt: null,
      },
    });

    if (!existingMail) {
      return await this.prisma.customerMailList.create({
        data: {
          customerId: customer.id,
          mail,
          isSend,
        },
      });
    } else {
      return await this.prisma.customerMailList.update({
        where: {
          id: existingMail.id,
        },
        data: {
          isSend,
        },
      });
    }
  }
}
