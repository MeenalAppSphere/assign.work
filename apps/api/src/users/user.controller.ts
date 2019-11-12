import { Controller, Get, UseGuards, Request, Put, Body, Query, Post } from '@nestjs/common';
import { UsersService } from '../shared/services/users.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@aavantan-app/models';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly _userService: UsersService) {
  }

  @Get('profile')
  async getUser(@Request() req) {
    // return await this._userService.findById(req.user.id, [{
    //   path: 'projects',
    //   select: 'name description'
    // },
    //   {
    //     path: 'organizations',
    //     select: 'name description'
    //   },
    //   {
    //     path: 'currentProject',
    //     populate: {
    //       path: 'members.userDetails'
    //     },
    //     justOne: true
    //   }, {
    //     path: 'currentOrganization',
    //     select: 'name description displayName logoUrl',
    //     justOne: true
    //   }]);

    return await this._userService.getUserProfile(req.user.id);
  }

  @Get('')
  async getAll() {
    return await this._userService.getAll();
  }

  @Put('profile')
  async updateUserProfile(@Body() id: string, @Body() user: Partial<User>) {
    return await this._userService.updateUser(id, user, null);
  }
}
