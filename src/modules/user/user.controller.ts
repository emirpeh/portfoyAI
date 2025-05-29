import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseUUIDPipe,
  Inject,
  forwardRef,
  Query,
  Delete,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CustomerService } from '../customer/customer.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
  ) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const { externalId, ...userData } = createUserDto;

    const user = await this.userService.createUser(
      userData.email,
      userData.password,
      userData.role,
    );

    if (user.role === Role.CUSTOMER) {
      const customer = await this.customerService.createCustomerAuth(
        user.id,
        externalId,
      );
      return {
        ...user,
        customer: {
          id: customer.id,
          externalId: customer.externalId,
        },
      };
    }

    return user;
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(
    @Query('offset') offset: number,
    @Query('limit') limit: number,
    @Query('email') email?: string,
  ) {
    return await this.userService.findAll(
      Number(offset) || 0,
      Number(limit) || 10,
      email,
    );
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.softDelete(id);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(id, updateUserDto);
  }
}
