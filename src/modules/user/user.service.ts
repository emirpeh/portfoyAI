/* eslint-disable prettier/prettier */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(
    email: string,
    password: string,
    role: Role = Role.CUSTOMER,
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
      },
    });

    const { ...result } = user;
    return result;
  }

  async findAll(offset: number, limit: number, email?: string) {
    const total = await this.prisma.user.count({
      where: {
        deletedAt: null,
        ...(email && {
          email: {
            contains: email,
          },
        }),
      },
    });

    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(email && {
          email: {
            contains: email,
          },
        }),
      },
      include: {
        customer: {
          select: {
            id: true,
            externalId: true,
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
      const { ...result } = user;
      return result;
    });

    return {
      data,
      total,
    };
  }

  async getUsersByExternalId(externalId: string[]) {
    return await this.prisma.customer.findMany({
      where: {
        externalId: {
          in: externalId,
        },
      },
      include: {
        user: {
          where: {
            deletedAt: null,
          },
        },
      },
      orderBy: {
        externalId: 'desc',
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        customer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { ...result } = user;
    return result;
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: { customer: true },
    });
  }
}
