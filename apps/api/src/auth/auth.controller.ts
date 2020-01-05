import { Body, Controller, Get, Headers, Post, Request, Response, UseGuards } from '@nestjs/common';
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

  @Get('send-email')
  async sendEmail() {
    return await this._authService.sendEmail();
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
  async googleValidateToken(@Body('token') token: string) {
    return await this._authService.verifyGoogleAuthToken(token);
  }

  @UseGuards(AuthGuard('google'))
  @Get('google')
  async googleLogin() {
    // GoogleStrategy to redirect to Google login page
  }

  @UseGuards(AuthGuard('google'))
  @Get('oauth2/callback')
  async googleCallback(@Request() req, @Response() res) {
    // Generate JWT token based on the OAuth2 logged in user
    const loginResult = await this._authService.createToken(req.user);
    // Pass the token to client app
    // this.setAccessTokenCookie(res, loginResult.accessToken);
    res.redirect(`http://localhost:4200/middleware?code=${loginResult.access_token}`);
  }
}
