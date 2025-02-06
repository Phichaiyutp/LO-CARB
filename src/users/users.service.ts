import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './users.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findOne(username: string){
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string){
    return this.userModel.findById(id).exec();
  }

  async create(userData: any): Promise<User> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }
}
