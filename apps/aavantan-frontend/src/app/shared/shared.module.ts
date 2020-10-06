import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { AddProjectComponent } from './components/add-project/add-project.component';
import { SearchPipe } from './pipes/search.pipe';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TaskListComponent } from './components/task-list/task-list.component';
import { LoaderComponent } from './components/loader/loader.component';
import { TimelogComponent } from './components/timelog/timelog.component';
import { DateAgoPipe } from './pipes/dateago.pipe';
import { Safe } from './pipes/safehtml.pipe';
import { OrganisationComponent } from './components/organisation/organisation.component';
import { NumericDirective } from './directives/numbers-only.directive';
import { AddEpicComponent } from './components/add-epic/add-epic.component';
import { RouterModule } from '@angular/router';
import { ProfileNameComponent } from './components/profile-name/profile-name.component';
import { KeysPipe } from './pipes/keys.pipe';
import { NgxPermissionsModule } from 'ngx-permissions';
import { UserFilterComponent } from './components/user-filter/user-filter.component';
import { TeamCapacityComponent } from './components/team-capacity/team-capacity.component';
import { TeamCapacityModelComponent } from './components/team-capacity-model/team-capacity.model.component';
import { CloseSprintComponent } from './components/modal-close-sprint/modal-close-sprint.component';
import { AddStatusComponent } from './components/add-status/add-status.component';
import { ColorSketchModule } from 'ngx-color/sketch';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { SprintDetailsComponent } from './components/sprint-details/sprint-details.component';

@NgModule({
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgZorroAntdModule,
    PerfectScrollbarModule,
    AddProjectComponent,
    OrganisationComponent,
    TimelogComponent,
    SearchPipe,
    TaskListComponent,
    LoaderComponent,
    DateAgoPipe,
    Safe,
    NumericDirective,
    AddEpicComponent,
    ProfileNameComponent,
    UserFilterComponent,
    TeamCapacityComponent,
    TeamCapacityModelComponent,
    CloseSprintComponent,
    KeysPipe,
    AddStatusComponent,
    NzPopoverModule,
    SprintDetailsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule,
    PerfectScrollbarModule,
    TypeaheadModule,
    PopoverModule,
    RouterModule,
    ColorSketchModule,
    NzPopoverModule,
  ],
  declarations: [
    AddProjectComponent,
    OrganisationComponent,
    TimelogComponent,
    SearchPipe,
    TaskListComponent,
    LoaderComponent,
    DateAgoPipe,
    Safe,
    NumericDirective,
    AddEpicComponent,
    ProfileNameComponent,
    KeysPipe,
    UserFilterComponent,
    TeamCapacityComponent,
    TeamCapacityModelComponent,
    CloseSprintComponent,
    AddStatusComponent,
    SprintDetailsComponent
  ]
})
export class SharedModule {
}
