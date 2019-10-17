import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { MongoosePaginateQuery, Project, ProjectMembers } from '@aavantan-app/models';
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

  @Put()
  async updateProject(@Query() id: string, @Body() project: Project) {
    return await this._projectService.updateProject(id, project);
  }

  @Post(':id/add-collaborators')
  async addCollaborators(@Query() id: string, @Body() members: ProjectMembers[]) {
    return await this._projectService.addCollaborators(id, members);
  }

}
