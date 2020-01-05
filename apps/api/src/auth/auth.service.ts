import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  DbCollection,
  MemberTypes,
  User,
  UserLoginProviderEnum,
  UserLoginWithPasswordRequest,
  UserStatus
} from '@aavantan-app/models';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { get, Response } from 'request';
import { UsersService } from '../shared/services/users.service';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class AuthService implements OnModuleInit {
  private _userService: UsersService;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>,
    private _moduleRef: ModuleRef
  ) {
  }

  onModuleInit(): any {
    this._userService = this._moduleRef.get('UsersService', { strict: false });
  }

  createToken(user: any) {
    return {
      access_token: this.jwtService.sign({ emailId: user.email, sub: user.id })
    };
  }

  async sendEmail() {

  }

  async login(req: UserLoginWithPasswordRequest) {
    // check user
    const user = await this._userModel.findOne({
      emailId: req.emailId,
      password: req.password
    }).populate(['projects', 'organization', 'currentProject']).exec();

    if (user) {
      // update user last login provider to normal
      await user.updateOne({ $set: { lastLoginProvider: UserLoginProviderEnum.normal } });

      // return jwt token
      return {
        user: user.toJSON(),
        access_token: this.jwtService.sign({ sub: user.emailId, id: user.id })
      };
    } else {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  async signUpWithPassword(user: User) {
    const session = await this._userModel.db.startSession();
    session.startTransaction();

    try {
      const model = new this._userModel(user);
      model.username = model.emailId;
      model.status = UserStatus.Active;
      model.lastLoginProvider = UserLoginProviderEnum.normal;
      model.memberType = MemberTypes.alien;

      const newUser = await this._userModel.create([model], session);
      const userDetails = await newUser[0].populate(['projects', 'organization', 'currentProject']).execPopulate();
      const payload = { sub: userDetails.emailId, id: userDetails.id };
      await session.commitTransaction();
      session.endSession();

      return {
        user: userDetails.toJSON(),
        access_token: this.jwtService.sign(payload)
      };
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * verify given auth token with google
   * check if given token is valid
   * if valid then check if one is existing user or not of our app
   * if existing user update it's last login type and return jwt token
   * if new user create new user and return jwt token
   * @param token
   */
  async verifyGoogleAuthToken(token: string) {
    if (!token) {
      throw new BadRequestException('token not found');
    }

    try {
      const authTokenResult = await this.googleAuthTokenChecker(token);

      /*
        as per google if we receive token is valid
        we still need to check if token aud property contains our app client id
       */
      if (authTokenResult) {
        if (authTokenResult.aud === process.env.GOOGLE_CLIENT_ID) {
          const userFromDb = await this._userModel.findOne({
            emailId: authTokenResult.email
            // status: UserStatus.Active
          });

          if (!userFromDb) {
            const userNameFromGoogle = authTokenResult.name.split(' ');
            // create new user model
            const user = new User();
            user.emailId = authTokenResult.email;
            user.username = user.emailId;
            user.firstName = userNameFromGoogle[0] || '';
            user.lastName = userNameFromGoogle[1] || '';
            user.lastLoginProvider = UserLoginProviderEnum.google;
            user.profilePic = authTokenResult.picture;
            user.status = UserStatus.Active;
            user.memberType = MemberTypes.alien;

            // save it to db
            const newUser = await this._userModel.create(user);
            const userDetails = await newUser[0].populate(['projects', 'organization', 'currentProject']).execPopulate();
            const payload = { sub: userDetails.emailId, id: userDetails.id };

            // return jwt token
            return {
              user: userDetails.toJSON(),
              access_token: this.jwtService.sign(payload)
            };
          } else {
            // if user is already in db then update it's last login type to google
            // update user profile pic
            await this._userModel.updateOne({ _id: userFromDb._id },
              { $set: { lastLoginProvider: UserLoginProviderEnum.google, profilePic:  authTokenResult.picture} }
            );
            const userDetails = await this._userModel.findOne({ _id: userFromDb._id }).populate(['projects', 'organization', 'currentProject']).lean();

            // return jwt token
            return {
              user: userDetails,
              access_token: this.jwtService.sign({ sub: userDetails.emailId, id: userDetails._id })
            };
          }

        } else {
          throw new UnauthorizedException('Invalid user login');
        }
      }

      return authTokenResult;
    } catch (e) {
      throw e;
    }
  }

  async googleAuthTokenChecker(token: string) {
    return new Promise<any>((resolve: Function, reject: Function) => {
      get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`, async (err: Error, res: Response, body: any) => {
        if (err) {
          reject(err);
        }

        body = JSON.parse(body);

        if (body.error) {
          reject(body.error);
        }

        resolve(body);
      });
    });
  }

}
