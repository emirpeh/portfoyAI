import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { RequestService } from './request.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('requests')
export class RequestController {
    constructor(private readonly requestService: RequestService) { }

    @Post()
    create(@Body(new ValidationPipe()) createRequestDto: CreateRequestDto) {
        return this.requestService.create(createRequestDto);
    }
} 