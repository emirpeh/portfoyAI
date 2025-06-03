import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Role enum'u manuel olarak tanımlıyoruz
enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  CUSTOMER = 'CUSTOMER'
}

const prisma = new PrismaClient();

async function main() {
  // Default admin kullanıcısı var mı kontrol et
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: 'admin@portfolioai.com', // Emlak sektörü için uygun e-posta
    },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('PortfolioAI2023', 10); // Güvenli şifre

    // Default admin kullanıcısını oluştur
    await prisma.user.create({
      data: {
        email: 'admin@portfolioai.com',
        password: hashedPassword,
        role: Role.ADMIN,
        name: 'Admin User',
      },
    });

    console.log('Default admin user created successfully');
  } else {
    console.log('Default admin user already exists');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
