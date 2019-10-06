import { Body, Controller, Post } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { Organization } from '@aavantan-app/models';

@Controller('organization')
export class OrganizationController {

  constructor(private readonly _organizationService: OrganizationService) {
  }

  @Post()
  async createOrganization(@Body() organization: Organization) {
    return await this._organizationService.createOrganization(organization);
  }

}
