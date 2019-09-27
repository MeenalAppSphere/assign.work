import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy){
  constructor() {
    super({
      clientID: '768411236596-gpfmj78vq5latkc7gi7b8digjd66ngi2.apps.googleusercontent.com',
      clientSecret: '0BhMFxwTMuJ70ZllFcqcOT2w',
      callbackURL: 'http://localhost:7777/api/auth/google/callback'
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
