import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './jwt/constants';
import { JwtStrategy } from './jwt/jwt.strategy';
import { SharedModule } from '../shared/shared.module';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google/google.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' }
    }),
    SharedModule
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  controllers: [AuthController],
  exports: [JwtModule]
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
  }
}
