import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllOptions {
  name?: string;
  email?: string;
  phone?: string;
  countries?: string[];
  foreignTrades?: string[];
  status?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class SupplierService {
  private readonly logger = new Logger(SupplierService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    try {
      const supplier = await this.prisma.supplierContactList.create({
        data: {
          name: createSupplierDto.name,
          email: createSupplierDto.email,
          customs: createSupplierDto.customs.join(','),
          gender: createSupplierDto.gender,
          companyName: createSupplierDto.companyName,
          countries: createSupplierDto.countries.join(','),
          foreignTrades: createSupplierDto.foreignTrades.join(','),
          language: createSupplierDto.language,
        },
      });
      this.logger.log(`Created supplier with ID: ${supplier.id}`);
      return supplier;
    } catch (error) {
      this.logger.error(`Failed to create supplier: ${error.message}`);
      throw error;
    }
  }

  async createMany(createSupplierDtos: { suppliers: CreateSupplierDto[] }) {
    try {
      const suppliers = await Promise.all(
        createSupplierDtos.suppliers.map(dto =>
          this.prisma.supplierContactList.create({
            data: {
              name: dto.name,
              email: dto.email,
              customs: dto.customs.join(','),
              gender: dto.gender,
              companyName: dto.companyName,
              countries: dto.countries.join(','),
              foreignTrades: dto.foreignTrades.join(','),
              language: dto.language,
            },
          }),
        ),
      );
      this.logger.log(`Created ${suppliers.length} suppliers`);
      return suppliers;
    } catch (error) {
      this.logger.error(`Failed to create suppliers: ${error.message}`);
      throw error;
    }
  }

  async findAll(options?: FindAllOptions) {
    const where = {
      deletedAt: null,
      ...(options?.name && {
        name: { contains: options.name },
      }),
      ...(options?.email && {
        email: { contains: options.email },
      }),
      ...(options?.phone && {
        phone: { contains: options.phone },
      }),
      ...(options?.countries && {
        OR: options.countries.map(country => ({
          countries: {
            contains: country,
          },
        })),
      }),
      ...(options?.foreignTrades && {
        OR: options.foreignTrades.map(trade => ({
          foreignTrades: {
            contains: trade,
          },
        })),
      }),
      ...(options?.status && { status: options.status }),
    };

    const [total, data] = await Promise.all([
      this.prisma.supplierContactList.count({ where }),
      this.prisma.supplierContactList.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: options?.limit,
        skip: options?.offset,
      }),
    ]);

    return {
      data: data.map(supplier => ({
        ...supplier,
        countries: supplier.countries.split(','),
        foreignTrades: supplier.foreignTrades.split(','),
      })),
      pagination: {
        total,
        limit: options?.limit,
        offset: options?.offset,
      },
    };
  }

  async findOne(id: number) {
    try {
      const supplier = await this.prisma.supplierContactList.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }

      return {
        ...supplier,
        countries: supplier.countries.split(','),
        foreignTrades: supplier.foreignTrades.split(','),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch supplier: ${error.message}`);
      throw error;
    }
  }

  async findByEmail(email: string) {
    return await this.prisma.supplierContactList.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async update(id: number, updateSupplierDto: Partial<CreateSupplierDto>) {
    try {
      const supplier = await this.prisma.supplierContactList.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }

      const updatedSupplier = await this.prisma.supplierContactList.update({
        where: { id },
        data: {
          name: updateSupplierDto.name,
          email: updateSupplierDto.email,
          customs: updateSupplierDto.customs?.join(','),
          gender: updateSupplierDto.gender,
          companyName: updateSupplierDto.companyName,
          countries: updateSupplierDto.countries?.join(','),
          foreignTrades: updateSupplierDto.foreignTrades?.join(','),
        },
      });

      this.logger.log(`Updated supplier with ID: ${id}`);
      return {
        ...updatedSupplier,
        countries: updatedSupplier.countries.split(','),
        foreignTrades: updatedSupplier.foreignTrades.split(','),
      };
    } catch (error) {
      this.logger.error(`Failed to update supplier: ${error.message}`);
      throw error;
    }
  }

  async getAllCustoms() {
    const customs = await this.prisma.supplierContactList.findMany({
      select: {
        customs: true,
      },
      where: {
        deletedAt: null,
        customs: {
          not: null,
        },
      },
    });

    // Flatten and filter out empty strings
    const allCustoms = customs
      .map(custom => custom.customs.split(','))
      .flat()
      .filter(custom => custom.trim() !== '');

    // Remove duplicates
    return [...new Set(allCustoms)];
  }

  async remove(id: number) {
    try {
      const supplier = await this.prisma.supplierContactList.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }

      await this.prisma.supplierContactList.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      this.logger.log(`Soft deleted supplier with ID: ${id}`);
      return { message: 'Supplier deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete supplier: ${error.message}`);
      throw error;
    }
  }
}
