import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDTO } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(registerDTO: RegisterDTO): Promise<UserResponseDto> {
    const { email } = registerDTO;

    // ตรวจสอบว่าอีเมลมีอยู่แล้วหรือไม่
    const existingUser = await this.userModel.findOne({ email }).lean();
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // สร้าง User ใหม่
    const newUser = new this.userModel(registerDTO);
    const savedUser = await newUser.save();

    // แปลงข้อมูลให้เป็น DTO
    return plainToInstance(
      UserResponseDto,
      savedUser.toObject({ versionKey: false }),
      { excludeExtraneousValues: true }
    );
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userModel
      .findOne({ email })
      .select('-password -__v')
      .lean()
      .exec();

    if (!user) return null;

    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }

  async findPasswordByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email }).exec();
  }
}
