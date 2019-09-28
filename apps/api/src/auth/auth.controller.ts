import { Body, Controller, Get, Post, Request, UseGuards, Headers, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User, UserLoginWithPasswordRequest } from '@aavantan-app/models';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private _authService: AuthService) {
  }

  @Post('login')
  async login(@Body() req: UserLoginWithPasswordRequest) {
    return await this._authService.login(req);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('register')
  async signUp(@Body() user: User, @Headers('accept-language') locale: string) {
    user.locale = locale || 'en-Us';
    return await this._authService.signUpWithPassword(user);
  }

  @Get('google/uri')
  async requestGoogleRedirectUri(): Promise<any> {
    return await this._authService.requestGoogleRedirectUri();
  }

  @Post('google/signin')
  async googleSignIn(@Req() req: any): Promise<any> {
    return await this._authService.googleSignIn(req.body.code);
  }

  @Post('google/token')
  async requestJsonWebTokenAfterGoogleSignIn(@Req() req: any): Promise<any> {
    return await this._authService.createToken(req.user);
  }
}
