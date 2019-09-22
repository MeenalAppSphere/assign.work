import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { HomeComponent } from './home/home.component';
import { ProjectComponent } from './project/project.component';
import { BoardComponent } from './board/board.component';
import { ActivesprintComponent } from './activesprint/activesprint.component';
import { BacklogComponent } from './backlog/backlog.component';
import { PermissionsComponent } from './settings/permissions/permissions.component';
import { CollaboratorsComponent } from './settings/collaborators/collaborators.component';
import { AppsService } from '../shared/services/apps.service';
import { TypeaheadModule } from 'ngx-bootstrap';
import { DashboardComponent } from './dashboard.component';
import { TemplateModule } from '../shared/template/template.module';

@NgModule({
  imports: [
    TemplateModule,
    CommonModule,
    SharedModule,
    DashboardRoutingModule,
    TypeaheadModule.forRoot()
  ],
  exports: [],
  declarations: [
    DashboardComponent,
    HomeComponent,
    ProjectComponent,
    BoardComponent,
    ActivesprintComponent,
    BacklogComponent,
    PermissionsComponent,
    CollaboratorsComponent
  ],
  providers: [
    ThemeConstantService,
    AppsService
  ]
})
export class DashboardModule {
}
