import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(emailId: string, password: string): Promise<any> {
    console.log(emailId);
    const user = await this.authService.validateUser(emailId, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
