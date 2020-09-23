import { ModuleWithProviders, NgModule } from '@angular/core';
import { ThemeConstantService } from './theme-constant.service';
import { ValidationRegexService } from './validation-regex.service';
import { HttpWrapperService } from './httpWrapper.service';
import { AuthService } from './auth.service';
import { GeneralService } from './general.service';
import { LoaderService } from './loader.service';
import { UserService } from './user/user.service';
import { OrganizationService } from './organization/organization.service';
import { ProjectService } from './project/project.service';
import { TaskService } from './task/task.service';
import { SprintService } from './sprint/sprint.service';
import { InvitationService } from './invitation/invitation.service';
import { TaskPriorityService } from './task-priority/task-priority.service';
import { TaskStatusService } from './task-status/task-status.service';
import { TaskTypeService } from './task-type/task-type.service';
import { BoardService } from './board/board.service';
import { SprintReportService } from './sprint-report/sprint-report.service';

@NgModule()
export class ServiceModule {

  public static forRoot(): ModuleWithProviders<ServiceModule> {
    return {
      ngModule: ServiceModule,
      providers: [
        ThemeConstantService,
        ValidationRegexService,
        HttpWrapperService,
        AuthService,
        GeneralService,
        LoaderService,
        UserService,
        OrganizationService,
        ProjectService,
        TaskService,
        SprintService,
        InvitationService,
        TaskPriorityService,
        TaskStatusService,
        TaskTypeService,
        BoardService,
        SprintReportService
      ]
    };
  }

}
