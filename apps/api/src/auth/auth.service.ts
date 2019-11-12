import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
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
import { post, Response } from 'request';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(DbCollection.users) private readonly _userModel: Model<User & Document>
  ) {
  }

  createToken(user: any) {
    return {
      access_token: this.jwtService.sign({ emailId: user.email, sub: user.id })
    };
  }

  async login(req: UserLoginWithPasswordRequest) {
    const user = await this._userModel.findOne({
      emailId: req.emailId,
      password: req.password
    }).populate(['projects', 'organization', 'currentProject']).exec();
    if (user) {
      return {
        user: user.toJSON(),
        access_token: this.jwtService.sign({ sub: user.emailId, id: user.id })
      };
    } else {
      throw new UnauthorizedException('invalid email or password');
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

  async requestGoogleRedirectUri(): Promise<{ redirect_uri: string } | any> {
    const queryParams: string[] = [
      `client_id=786347906702-f24fedavhbjl61iebi8e3obhdftj452k.apps.googleusercontent.com`,
      `redirect_uri=http://localhost:4200/middleware`,
      `response_type=code`,
      `scope=https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read`
    ];
    const redirect_uri = `${'https://accounts.google.com/o/oauth2/auth'}?${queryParams.join('&')}`;

    return {
      redirect_uri
    };
  }

  async googleSignIn(code: string): Promise<any> {
    return new Promise((resolve: Function, reject: Function) => {
      post({
        url: 'https://accounts.google.com/o/oauth2/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
          code,
          client_id: '786347906702-f24fedavhbjl61iebi8e3obhdftj452k.apps.googleusercontent.com',
          client_secret: 'ad1o3FgYmhCH6QeZYL5nr_LI',
          redirect_uri: 'http://localhost:4200/middleware',
          grant_type: 'authorization_code'
        }
      }, async (err: Error, res: Response, body: any) => {
        if (err) {
          return reject(err);
        }

        if (body.error) {
          return reject(body.error);
        }

        const { access_token } = JSON.parse(body);

        post({
          url: `http://localhost:3333/api/auth/google/token`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          form: {
            access_token
          }
        }, async (err1: Error, res1: Response, body1: any) => {
          if (err1) {
            return reject(err1);
          }

          if (body1.error) {
            return reject(body1.error);
          }

          resolve(body1);
        });
      });
    });
  }

}
