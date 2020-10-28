import { Body, Controller, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { UsersService } from '../shared/services/users.service';
import { AuthGuard } from '@nestjs/passport';
import { ChangePasswordModel, SearchUserModel, User } from '@aavantan-app/models';
import { RolesGuard } from '../shared/guard/roles.gaurd';

@Controller('user')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private readonly _userService: UsersService) {
  }

  @Post('change-password')
  async changePassword(@Body() model: ChangePasswordModel) {
    return await this._userService.changePassword(model);
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
