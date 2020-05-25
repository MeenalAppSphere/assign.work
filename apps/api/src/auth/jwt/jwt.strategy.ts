import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';
import { GeneralService } from '../../shared/services/general.service';
import { InjectModel } from '@nestjs/mongoose';
import { DbCollection, User } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { UserRoleService } from '../../shared/services/user-role/user-role.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private _generalService: GeneralService, @InjectModel(DbCollection.users) protected readonly _userModel: Model<User & Document>,
              private _userRoleService: UserRoleService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: jwtConstants.secret
    });
  }

  async validate(payload: any) {
    const userDetails = await this._userModel.findById(payload.id).select('_id currentProject').populate('currentProject');
    if (!userDetails) {
      this._generalService.userId = null;
      throw new UnauthorizedException();
    }

    const ownerDetails = userDetails.currentProject.members.find(member => member.userId.toString() === payload.id);

    const roleDetails = await this._userRoleService.getUserRoleById(userDetails.currentProject._id, ownerDetails.userRoleId);



    this._generalService.userId = payload.id;
    return { emailId: payload.sub, id: payload.id, role: roleDetails };
    }
}
