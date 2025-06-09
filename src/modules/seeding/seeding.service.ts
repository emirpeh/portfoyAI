import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class SeedingService implements OnModuleInit {
    private readonly logger = new Logger(SeedingService.name);

    constructor(private readonly userService: UserService) { }

    async onModuleInit() {
        this.logger.log('Starting database seeding...');
        await this.seedAdminUser();
        this.logger.log('Seeding complete.');
    }

    private async seedAdminUser() {
        const adminEmail = 'admin@portfoyai.com';
        this.logger.log(`Checking for admin user: ${adminEmail}`);

        const existingAdmin = await this.userService.findByEmail(adminEmail);

        if (!existingAdmin) {
            this.logger.log(`Admin user not found. Creating a new one...`);
            try {
                const adminUser = await this.userService.create({
                    email: adminEmail,
                    password: 'password', // Lütfen bu şifreyi daha sonra güvenli bir yerden alın veya değiştirin
                    name: 'Admin',
                    role: Role.ADMIN,
                });
                this.logger.log(`Admin user created successfully: ${adminUser.email}`);
            } catch (error) {
                this.logger.error('Failed to create admin user.', error.stack);
            }
        } else {
            this.logger.log('Admin user already exists. Skipping creation.');
        }
    }
} 