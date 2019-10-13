import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { MongoosePaginateQuery, Project } from '@aavantan-app/models';
import { AuthGuard } from '@nestjs/passport';

@Controller('project')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {

  constructor(private readonly _projectService: ProjectService) {

  }

  @Get()
  async getAll() {
    return await this._projectService.getAll({}, ['members.userDetails']);
  }

  @Post()
  async createProject(@Body() model: Project) {
    return await this._projectService.addProject(model);
  }

  @Delete(':id')
  async deleteProject(@Query() id: string) {
    return await this._projectService.delete(id);
  }

}
