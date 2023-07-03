import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private saldRound: number;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.saldRound = 10;
  }

  async create(newUser: CreateUserDto): Promise<User | { message: string }> {
    const { email, password } = newUser;
    newUser.password = await bcrypt.hash(password, this.saldRound);

    try {
      const userExist = await this.userRepository.findOneBy({
        email,
      });

      if (userExist) {
        throw new ConflictException('User exist');
      }

      const user = this.userRepository.create(newUser);
      const response = await this.userRepository.save(user);

      if (!response) {
        throw new NotFoundException('Failed ');
      }

      return response;
    } catch (error) {
      return error.response;
    }
  }

  async findAll() {
    try {
      const response = await this.userRepository.find();
      if (!response) throw new NotFoundException();
      return response;
    } catch (error) {
      return error.response;
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) throw new NotFoundException();
      const { password, ...rest } = user;
      return user;
    } catch (error) {
      return error.response;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      const saltOrRounds = 10;
      updateUserDto.password = await bcrypt.hash('random123', saltOrRounds);
    }

    try {
      const user = await this.userRepository.findOneBy({ id });

      if (!user) throw new NotFoundException();

      Object.assign(user, updateUserDto);

      const response = await this.userRepository.save(user);
      const { password, ...rest } = response;
      return response;
    } catch (error) {
      return error.response;
    }
  }

  async remove(id: number) {
    try {
      const isExistUser = await this.userRepository.findOneBy({ id });
      if (!isExistUser) throw new NotFoundException();
      const user = await this.userRepository.remove(isExistUser);
      return { message: `${user.email} has been deleted successfully` };
    } catch (error) {
      return error.response;
    }
  }
}
