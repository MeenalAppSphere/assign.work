import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbCollection } from '@aavantan-app/models';
import { userSchema } from '../schemas/users.schema';
import { UsersService } from './services/users.service';
import { AuthService } from './services/auth.service';
import { LocalStrategy } from './services/jwt/local.strategy';
import { JwtStrategy } from './services/jwt/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './services/jwt/constants';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' }
    }),
    MongooseModule.forFeature([{
      name: DbCollection.users,
      schema: userSchema,
      collection: DbCollection.users
    }])
  ],
  exports: [AuthService, UsersService],
  providers: [
    LocalStrategy, JwtStrategy, AuthService, UsersService
  ]
})
export class SharedModule {

}
