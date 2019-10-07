import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { MongoosePaginateQuery, Project } from '@aavantan-app/models';

@Controller('project')
export class ProjectController {

  constructor(private readonly _projectService: ProjectService) {

  }

  @Get()
  async getAll() {
    return await this._projectService.getAllPaginatedData({}, new MongoosePaginateQuery());
  }

  @Post()
  async createProject(@Body() model: Project) {
    return await this._projectService.addProject(model);
  }

  @Delete(':id')
  async deleteProject(@Query() id: string) {

  }
}
