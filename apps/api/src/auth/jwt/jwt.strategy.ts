import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import { GeneralService } from '../../shared/services/general.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private _generalService: GeneralService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: jwtConstants.secret
    });
  }

  async validate(payload: any) {
    this._generalService.userId = payload.id;
    return { emailId: payload.sub, id: payload.id };
  }
}
