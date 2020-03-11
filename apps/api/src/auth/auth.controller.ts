import { Body, Controller, Get, Headers, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ResetPasswordVerifyModel, User, UserLoginWithPasswordRequest } from '@aavantan-app/models';
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

  @Post('google/validate-token')
  async googleValidateToken(@Body('token') token: string, @Body('invitationId') invitationId: string) {
    return await this._authService.verifyGoogleAuthToken(token, invitationId);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('emailId') emailId: string) {
    return await this._authService.forgotPassword(emailId);
  }

  @Post('reset-password')
  async resetPassword(@Body() model: ResetPasswordVerifyModel) {
    return await this._authService.resetPassword(model);
  }
}
