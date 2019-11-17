import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import { GeneralService } from '../../shared/services/general.service';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, User } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private _generalService: GeneralService, @InjectModel(DbCollection.users) protected readonly _userModel: Model<User & Document>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: jwtConstants.secret
    });
  }

  async validate(payload: any) {
    const userDetails = this._userModel.findById(payload.id).select('_id');
    if (!userDetails) {
      this._generalService.userId = null;
      throw new UnauthorizedException();
    }
    this._generalService.userId = payload.id;
    return { emailId: payload.sub, id: payload.id };
  }
}
