import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { Customer, Prisma } from '@prisma/client';

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(private readonly database: DatabaseService) { }

  /**
   * Yeni bir satıcı oluşturur.
   * @param createSellerDto - Satıcı oluşturma verileri
   * @returns Oluşturulan müşteri (satıcı)
   */
  async create(createSellerDto: CreateSellerDto): Promise<Customer> {
    try {
      const seller = await this.database.customer.create({
        data: {
          ...createSellerDto,
          customerType: 'SELLER', // Tipi her zaman SELLER olarak ayarla
        },
      });
      this.logger.log(`Created seller with ID: ${seller.id}`);
      return seller;
    } catch (error) {
      this.logger.error(
        `Failed to create seller: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Tüm satıcıları belirli filtrelere göre bulur ve sayfalar.
   * @param options - Filtreleme ve sayfalama seçenekleri
   * @returns Sayfalanmış satıcı listesi
   */
  async findAll(options?: {
    name?: string;
    email?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      customerType: { in: ['SELLER', 'BOTH'] },
      ...(options?.name && { name: { contains: options.name } }),
      ...(options?.email && { email: { contains: options.email } }),
    };

    const [total, data] = await this.database.$transaction([
      this.database.customer.count({ where }),
      this.database.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ? +options.limit : undefined,
        skip: options?.offset ? +options.offset : undefined,
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        limit: options?.limit,
        offset: options?.offset,
      },
    };
  }

  /**
   * Belirtilen ID'ye sahip tek bir satıcıyı bulur.
   * @param id - Satıcı ID'si
   * @returns Bulunan satıcı
   */
  async findOne(id: string): Promise<Customer> {
    const seller = await this.database.customer.findFirst({
      where: {
        id,
        deletedAt: null,
        customerType: { in: ['SELLER', 'BOTH'] },
      },
    });

    if (!seller) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }
    return seller;
  }

  /**
   * Belirtilen ID'ye sahip satıcının bilgilerini günceller.
   * @param id - Satıcı ID'si
   * @param updateSellerDto - Güncellenecek veriler
   * @returns Güncellenmiş satıcı
   */
  async update(
    id: string,
    updateSellerDto: Partial<CreateSellerDto>,
  ): Promise<Customer> {
    await this.findOne(id); // Satıcının var olup olmadığını kontrol et
    try {
      const updatedSeller = await this.database.customer.update({
        where: { id },
        data: updateSellerDto,
      });
      this.logger.log(`Updated seller with ID: ${id}`);
      return updatedSeller;
    } catch (error) {
      this.logger.error(
        `Failed to update seller: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Belirtilen ID'ye sahip satıcıyı siler (soft delete).
   * @param id - Satıcı ID'si
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Satıcının var olup olmadığını kontrol et
    await this.database.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.log(`Soft deleted seller with ID: ${id}`);
  }
}
