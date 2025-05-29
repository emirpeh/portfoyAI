import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
  }

  private async seedDefaultAdmin() {
    // Default admin kullanıcısı var mı kontrol et
    const existingAdmin = await this.prisma.user.findFirst({
      where: {
        email: 'info@maxitransport.net',
        isDefault: true,
      },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('MAXI2023', 10);

      // Default admin kullanıcısını oluştur
      await this.prisma.user.create({
        data: {
          email: 'info@maxitransport.net',
          password: hashedPassword,
          role: Role.ADMIN,
          isDefault: true,
        },
      });

      console.log('Default admin user created successfully');
    } else {
      console.log('Default admin user already exists');
    }
  }
}
