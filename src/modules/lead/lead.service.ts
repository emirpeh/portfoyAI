import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LeadService {
    constructor(private readonly prisma: DatabaseService) { }

    findAll() {
        return this.prisma.propertySearchRequest.findMany({
            include: {
                customer: true,
                mailLogs: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    findOne(id: string) {
        return this.prisma.propertySearchRequest.findUnique({
            where: { id },
            include: {
                customer: true,
                mailLogs: true,
            },
        });
    }
} 