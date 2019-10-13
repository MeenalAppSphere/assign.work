import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
  constructor(private readonly _userService: UsersService) {
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getUser(@Request() req) {
    return await this._userService.findById(req.user.id, ['projects', 'organization']);
  }

  @Get('')
  async getAll() {
    return await this._userService.getAll();
  }
}
