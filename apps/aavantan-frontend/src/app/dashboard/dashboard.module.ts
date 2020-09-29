import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { HomeComponent } from './home/home.component';
import { RunningSprintComponent } from './running-sprint/running-sprint.component';
import { ActivesprintComponent } from './activesprint/activesprint.component';
import { PermissionsComponent } from './settings/permissions/permissions.component';
import { CollaboratorsComponent } from './settings/collaborators/collaborators.component';
import { PopoverModule, SortableModule, TypeaheadModule } from 'ngx-bootstrap';
import { DashboardComponent } from './dashboard.component';
import { TemplateModule } from '../shared/template/template.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { DndModule } from 'ngx-drag-drop';
import { BoardDesignComponent } from './board-design/board-design.component';
import { SettingsModule } from '../settings/settings.module';
import { AssignUserComponent } from './board-design/assign-user/assign-user.component';
import { HiddenStatusComponent } from './board-design/hidden-status/hidden-status.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../../environments/environment';

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
    NzToolTipModule,
    DndModule,
    SettingsModule,
    HighchartsChartModule,
    SocketIoModule.forRoot(socketConfig)
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
    HiddenStatusComponent
  ],
  providers: [
    ThemeConstantService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardModule {
}
