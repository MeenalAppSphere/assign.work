import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './jwt/constants';
import { JwtStrategy } from './jwt/jwt.strategy';
import { SharedModule } from '../app/shared/shared.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google/google.strategy';
import { authenticate } from 'passport';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' }
    }),
    SharedModule,
    UsersModule
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  controllers: [AuthController]
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(authenticate('google', { session: false }))
      .forRoutes('api/auth/google/token')
  }
}
