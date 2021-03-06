import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ProjectService } from '../shared/services/project/project.service';
import {
  GetAllProjectsModel,
  Project,
  ProjectMembers,
  ProjectTemplateUpdateModel,
  ProjectWorkingCapacityUpdateDto,
  RecallProjectInvitationModel,
  ResendProjectInvitationModel,
  SearchProjectCollaborators,
  SearchProjectRequest,
  SearchProjectTags,
  SwitchProjectRequest,
  UpdateProjectRequestModel
} from '@aavantan-app/models';
import { AuthGuard } from '@nestjs/passport';

@Controller('project')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {

  constructor(private readonly _projectService: ProjectService) {

  }

  @Post('get-all')
  async getAll(@Body() model: GetAllProjectsModel) {
    return await this._projectService.getAllProjects(model);
  }

  @Post()
  async createProject(@Body() model: Project) {
    return await this._projectService.createProject(model);
  }

  @Post('update')
  async updateProject(@Body() project: UpdateProjectRequestModel) {
    return await this._projectService.updateProject(project);
  }

  @Post(':id/add-collaborators')
  async addCollaborators(@Param('id') id: string, @Body() members: ProjectMembers[]) {
    return await this._projectService.addCollaborators(id, members);
  }

  @Post('get-collaborators')
  async getCollaborators(@Body('projectId') projectId: string) {
    return await this._projectService.getCollaborators(projectId);
  }

  @Post('resend-invitation')
  async resendInvitation(@Body() model: ResendProjectInvitationModel) {
    return await this._projectService.resendProjectInvitation(model);
  }

  @Post('recall-invitation')
  async recallInvitation(@Body() model: RecallProjectInvitationModel) {
    return await this._projectService.recallProjectInvitation(model);
  }

  @Post('update-template')
  async updateProjectTemplate(@Body() model: ProjectTemplateUpdateModel) {
    return await this._projectService.updateProjectTemplate(model);
  }

  @Put(':id/update-working-capacity')
  async updateCollaboratorWorkingCapacity(@Param('id') id: string, @Body() dto: ProjectWorkingCapacityUpdateDto[]) {
    return await this._projectService.updateCollaboratorWorkingCapacity(id, dto);
  }

  @Post('switch-project')
  async switchProject(@Body() model: SwitchProjectRequest) {
    return await this._projectService.switchProject(model);
  }

  @Post('search')
  async searchProjects(@Body() model: SearchProjectRequest) {
    return await this._projectService.searchProject(model);
  }

  @Post('search-tags')
  async searchProjectTags(@Body() model: SearchProjectTags) {
    return await this._projectService.searchTags(model);
  }

  @Post('search-collaborator')
  async searchProjectCollaborators(@Body() model: SearchProjectCollaborators) {
    return await this._projectService.searchProjectCollaborators(model);
  }

  @Post('add-missing-project-default-settings')
  async addMissingProjectDefaultSettings() {
    return await this._projectService.addMissingProjectDefaultSettings();
  }
}
