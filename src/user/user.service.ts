import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDTO } from './dto/register.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(registerDTO: RegisterDTO): Promise<User> {
    const { email } = registerDTO;

    const existingUser = await this.userModel.findOne({ email }).lean();
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    const newUser = new this.userModel(registerDTO);
    return await newUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email }).select('-password -__v').exec();
  }
  async findPasswordByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email }).exec();
  }
}
