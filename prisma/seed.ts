import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Default admin kullanıcısı var mı kontrol et
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: 'info@maxitransport.net',
      isDefault: true,
    },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('MAXI2023', 10);

    // Default admin kullanıcısını oluştur
    await prisma.user.create({
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

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
