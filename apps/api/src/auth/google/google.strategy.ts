import { Injectable, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { use } from 'passport';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

const GoogleTokenStrategy = require('passport-google-plus-token');

//
@Injectable()
export class GoogleStrategy extends PassportStrategy(GoogleTokenStrategy) {
  constructor() {
    super({
      clientID: '786347906702-f24fedavhbjl61iebi8e3obhdftj452k.apps.googleusercontent.com',
      clientSecret: 'ad1o3FgYmhCH6QeZYL5nr_LI',
    });
  }

  async validate(accessToken, refreshToken, profile) {
    // TODO: Validate or register the user locally
    return {
      userId: profile.id,
      name: profile.displayName,
      username: profile.emails[0].value,
      picture: profile.photos[0].value,
      roles: ['user']
    };
  }
}

// export class GoogleStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     super({
//       clientID: '786347906702-f24fedavhbjl61iebi8e3obhdftj452k.apps.googleusercontent.com',
//       clientSecret: 'ad1o3FgYmhCH6QeZYL5nr_LI',
//       callbackURL: 'http://localhost:3333/api/auth/oauth2/callback',
//       scope: `profile email`,
//       proxy: true,
//     });
//   }
//
//   async validate(accessToken, refreshToken, profile) {
//     // TODO: Validate or register the user locally
//     return {
//       userId: profile.id,
//       name: profile.displayName,
//       username: profile.emails[0].value,
//       picture: profile.photos[0].value,
//       roles: ['user'],
//     };
//   }
// }
