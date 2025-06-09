import { Controller, Get, Param } from '@nestjs/common';
import { LeadService } from './lead.service';

@Controller('leads')
export class LeadController {
    constructor(private readonly leadService: LeadService) { }

    @Get()
    findAll() {
        return this.leadService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.leadService.findOne(id);
    }
} 