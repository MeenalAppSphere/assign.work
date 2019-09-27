import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbCollection, MemberTypes, User, UserLoginProviderEnum, UserStatus, UserLoginWithPasswordRequest } from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>,
  ) {
  }

  async validateUser(emailId: string, pass: string): Promise<any> {
    const user = await this._userModel.findOne({ emailId }).exec();
    console.log(user);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(req: UserLoginWithPasswordRequest) {
    const user = await this._userModel.findOne({ emailId: req.emailId, password: req.password }).exec();
    if (user) {
      return {
        access_token: this.jwtService.sign({ username: user.emailId, sub: user.id })
      };
    } else {
        throw new UnauthorizedException('invalid email or password');
    }
  }

  async signUpWithPassword(user: User) {
    try {
      const model = new this._userModel(user);
      model.username = model.emailId;
      model.status = UserStatus.Active;
      model.lastLoginProvider = UserLoginProviderEnum.normal;
      model.memberType = MemberTypes.alien;

      const newUser = await model.save();
      const payload = { username: user.username, sub: newUser.username };
      return {
        access_token: this.jwtService.sign(payload)
      };
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

}
