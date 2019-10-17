import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { Organization, Project } from '@aavantan-app/models';
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

  @Delete(':id')
  async deleteProject(@Query() id: string) {
    return await this._organizationService.delete(id);
  }

  @Put()
  async updateProject(@Query() id: string, @Body() organization: Organization) {
    return await this._organizationService.updateOrganization(id, organization);
  }
}
