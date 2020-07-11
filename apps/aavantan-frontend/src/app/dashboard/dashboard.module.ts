import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { HomeComponent } from './home/home.component';
import { RunningSprintComponent } from './running-sprint/running-sprint.component';
import { ActivesprintComponent } from './activesprint/activesprint.component';
import { PermissionsComponent } from './settings/permissions/permissions.component';
import { CollaboratorsComponent } from './settings/collaborators/collaborators.component';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { SortableModule } from 'ngx-bootstrap/sortable';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { DashboardComponent } from './dashboard.component';
import { TemplateModule } from '../shared/template/template.module';
import { JoyrideModule } from 'ngx-joyride';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { DndModule } from 'ngx-drag-drop';
import { BoardDesignComponent } from './board-design/board-design.component';
import { SettingsModule } from '../settings/settings.module';
import { AssignUserComponent } from './board-design/assign-user/assign-user.component';
import { HiddenStatusComponent } from './board-design/hidden-status/hidden-status.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../../environments/environment';
import { NoAccessComponent } from './not-found/no-access.component';
import { NgxPermissionsModule, NgxPermissionsRestrictStubModule } from 'ngx-permissions';

const socketConfig: SocketIoConfig = { url: environment.socketUrl, options: {} };

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
    NzToolTipModule,
    DndModule,
    // SettingsModule,
    HighchartsChartModule,
    SocketIoModule.forRoot(socketConfig),
    NgxPermissionsModule.forChild()
  ],
  exports: [],
  declarations: [
    DashboardComponent,
    HomeComponent,
    RunningSprintComponent,
    ActivesprintComponent,
    PermissionsComponent,
    CollaboratorsComponent,
    BoardDesignComponent,
    AssignUserComponent,
    HiddenStatusComponent,
    NoAccessComponent
  ],
  providers: [
    ThemeConstantService
  ]
})
export class DashboardModule {
}
