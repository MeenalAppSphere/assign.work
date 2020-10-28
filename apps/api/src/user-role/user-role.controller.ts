import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleService } from '../shared/services/user-role/user-role.service';
import { UserRoleModel } from '@aavantan-app/models';

@Controller('user-role')
@UseGuards(AuthGuard('jwt'))
export class UserRoleController {
  constructor(private readonly _userRoleService: UserRoleService) {
  }

  @Post('create')
  async createUserRole(@Body() model: UserRoleModel) {
    return await this._userRoleService.addUpdate(model);
  }

  @Post('update')
  async updateUserRole(@Body() model: UserRoleModel) {
    return await this._userRoleService.addUpdate(model);
  }

  @Post('get-all')
  async getAllUserRoles(@Body('projectId') projectId: string) {
    return await this._userRoleService.getAllUserRoles(projectId);
  }
}
