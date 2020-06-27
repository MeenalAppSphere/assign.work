import { Controller, Get, Header, Post, Res } from '@nestjs/common';
import { resolvePathHelper } from '../shared/helpers/helpers';
import { UserRoleService } from '../shared/services/user-role/user-role.service';

@Controller('public')
export class PublicController {
  constructor(private readonly _userRoleService: UserRoleService) {
  }

  @Get('error-log')
  @Header('Content-Type', 'application/octet-stream')
  getErrorLog(@Res() res) {
    res.sendFile(resolvePathHelper('error.log'));
  }

  @Post('add-missing-roles')
  async addMissingUserRoles() {
    return await this._userRoleService.addMissingUserRoles();
  }
}
