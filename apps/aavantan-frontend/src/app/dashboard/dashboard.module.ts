import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { HomeComponent } from './home/home.component';
import { BoardComponent } from './board/board.component';
import { ActivesprintComponent } from './activesprint/activesprint.component';
import { PermissionsComponent } from './settings/permissions/permissions.component';
import { CollaboratorsComponent } from './settings/collaborators/collaborators.component';
import { AppsService } from '../shared/services/apps.service';
import { PopoverModule, SortableModule, TypeaheadModule } from 'ngx-bootstrap';
import { DashboardComponent } from './dashboard.component';
import { TemplateModule } from '../shared/template/template.module';
import { JoyrideModule } from 'ngx-joyride';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CloseSprintComponent } from './board/modal-close-sprint/modal-close-sprint.component';

@NgModule({
  imports: [
    TemplateModule,
    CommonModule,
    SharedModule,
    DashboardRoutingModule,
    TypeaheadModule.forRoot(),
    SortableModule.forRoot(),
    PopoverModule.forRoot(),
    JoyrideModule.forRoot(),
    NzToolTipModule
  ],
  exports: [
  ],
  declarations: [
    DashboardComponent,
    HomeComponent,
    BoardComponent,
    ActivesprintComponent,
    PermissionsComponent,
    CollaboratorsComponent,
    CloseSprintComponent
  ],
  providers: [
    ThemeConstantService,
    AppsService
  ]
})
export class DashboardModule {
}
