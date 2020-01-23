import { Body, Controller, Delete, Post, Put, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from '../shared/services/organization.service';
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

  @Delete(':id')
  async deleteProject(@Query() id: string) {
    return await this._organizationService.delete(id);
  }

  @Put()
  async updateProject(@Query() id: string, @Body() organization: Organization) {
    return await this._organizationService.updateOrganization(id, organization);
  }

  @Post('switch-organization')
  async switchOrganization(@Body('organizationId') organizationId: string) {
    return await this._organizationService.switchOrganization(organizationId);
  }
}
