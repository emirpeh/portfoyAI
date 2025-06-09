import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcryptjs from 'bcryptjs';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly database: DatabaseService) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.database.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.database.user.findUnique({
      where: {
        id: String(id),
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    return user;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.database.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name, role } = createUserDto;

    const hashedPassword = await bcryptjs.hash(password, 10);

    try {
      const user = await this.database.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
      });
      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email already exists.');
      }
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw new BadRequestException('Could not create user.');
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const updatedUser = await this.database.user.update({
        where: { id: id },
        data: updateUserDto,
      });
      return updatedUser;
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
  }

  async deleteUser(id: string): Promise<User> {
    try {
      const user = await this.database.user.delete({
        where: { id: id },
      });
      return user;
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.findByEmail(email);
    if (user && (await bcryptjs.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}