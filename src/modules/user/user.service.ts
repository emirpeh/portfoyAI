/* eslint-disable prettier/prettier */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '../auth/enums/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(
    email: string,
    password: string,
    role: Role = Role.CUSTOMER,
    name: string = 'User', // name alanı zorunlu
  ) {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        name,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async findAll(offset: number, limit: number, email?: string) {
    const where = {
      ...(email && {
        email: {
          contains: email,
        },
      }),
    };

    const total = await this.prisma.user.count({ where });

    const users = await this.prisma.user.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const data = users.map(user => {
      const { password: _, ...result } = user;
      return result;
    });

    return {
      data,
      total,
    };
  }

  async getUsersByExternalId(externalId: string[]) {
    // Emlak sektörü için bu metodu uyarlayalım
    // Özellik adresi veya ilan numarası gibi bir kimlik kullanılabilir
    return await this.prisma.customer.findMany({
      where: {
        // Eğer externalId alanı modelde yoksa bu filtreyi kaldırın
        // veya farklı bir alan kullanın, örn: customerCode
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  async findById(id: string) {
    // ID'yi sayıya dönüştürme - Prisma şeması User.id'yi sayı olarak tanımlıyor
    const numericId = parseInt(id, 10);
    
    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid user ID');
    }
    
    const user = await this.prisma.user.findUnique({
      where: {
        id: numericId,
      },
      include: {
        customer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async softDelete(id: string) {
    // ID'yi sayıya dönüştürme
    const numericId = parseInt(id, 10);
    
    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid user ID');
    }
    
    const user = await this.prisma.user.findUnique({
      where: { id: numericId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Emlak sektöründe kullanıcı silme işlemi
    // Prisma'da deletedAt desteklenmiyorsa, kayıt silme işlemi gerçekleştirin
    return await this.prisma.user.delete({
      where: { id: numericId },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    // ID'yi sayıya dönüştürme
    const numericId = parseInt(id, 10);
    
    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid user ID');
    }
    
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: numericId },
      data: updateUserDto,
      include: { customer: true },
    });

    const { password: _, ...result } = updatedUser;
    return result;
  }
}
