import { Body, Controller, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { UsersService } from '../shared/services/users.service';
import { AuthGuard } from '@nestjs/passport';
import { SearchUserModel, User } from '@aavantan-app/models';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly _userService: UsersService) {
  }

  @Get('profile')
  async getUser(@Request() req) {
    return await this._userService.getUserProfile(req.user.id);
  }

  @Post('search')
  async getAll(@Body() model: SearchUserModel) {
    return await this._userService.searchUser(model);
  }

  @Put('profile')
  async updateUserProfile(@Body() id: string, @Body() user: Partial<User>) {
    return await this._userService.updateUser(id, user, null);
  }
}
