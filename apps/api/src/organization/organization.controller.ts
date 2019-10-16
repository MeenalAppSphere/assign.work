import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { Organization } from '@aavantan-app/models';
import { AuthGuard } from '@nestjs/passport';

@Controller('organization')
@UseGuards(AuthGuard('jwt'))
export class OrganizationController {

  constructor(private readonly _organizationService: OrganizationService) {
  }

  @Post()
  async createOrganization(@Body() organization: Organization) {
    return await this._organizationService.createOrganization(organization);
  }

  @Get('organization/users')
  async getAllOrganizatioinUsers(@Query() orgId: string) {
    return await this._organizationService.getAllUsers(orgId);
  }

}
