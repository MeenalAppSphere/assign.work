import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { use } from 'passport';

const GoogleTokenStrategy = require('passport-google-plus-token');

@Injectable()
export class GoogleStrategy {
  constructor(
  ) {
    this.init();
  }

  private init(): void {
    use('google', new GoogleTokenStrategy({
      clientID: '786347906702-f24fedavhbjl61iebi8e3obhdftj452k.apps.googleusercontent.com',
      clientSecret: 'ad1o3FgYmhCH6QeZYL5nr_LI',
    }, async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
      done(null, profile);
    }));
  }
}
