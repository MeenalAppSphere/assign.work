// import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { HttpClientModule } from '@angular/common/http';
// //import { NgZorroAntdModule } from 'ng-zorro-antd';
// import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
// import { AddProjectComponent } from './components/add-project/add-project.component';
// import { SearchPipe } from './pipes/search.pipe';
// import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
// import { PopoverModule } from 'ngx-bootstrap/popover';
// import { TaskListComponent } from './components/task-list/task-list.component';
// import { LoaderComponent } from './components/loader/loader.component';
// import { TimelogComponent } from './components/timelog/timelog.component';
// import { DateAgoPipe } from './pipes/dateago.pipe';
// import { Safe } from './pipes/safehtml.pipe';
// import { OrganisationComponent } from './components/organisation/organisation.component';
// import { NumericDirective } from './directives/numbers-only.directive';
// import { AddEpicComponent } from './components/add-epic/add-epic.component';
// import { RouterModule } from '@angular/router';
// import { ProfileNameComponent } from './components/profile-name/profile-name.component';
// import { KeysPipe } from './pipes/keys.pipe';
// import { NgxPermissionsModule } from 'ngx-permissions';
// import { UserFilterComponent } from './components/user-filter/user-filter.component';
// import { TeamCapacityComponent } from './components/team-capacity/team-capacity.component';
// import { TeamCapacityModelComponent } from './components/team-capacity-model/team-capacity.model.component';
// import { CloseSprintComponent } from './components/modal-close-sprint/modal-close-sprint.component';
// import { AddStatusComponent } from './components/add-status/add-status.component';
// import { ColorSketchModule } from 'ngx-color/sketch';
// import { NzPopoverModule } from 'ng-zorro-antd/popover';
// import { SprintDetailsComponent } from './components/sprint-details/sprint-details.component';
// import { QuillModule } from 'ngx-quill';
// import { StatusDropdownComponent } from './components/status-dropdown/status-dropdown.component';


// import { NzButtonModule } from 'ng-zorro-antd/button';
// import { NzModalModule } from 'ng-zorro-antd/modal';
// import { NzSpinModule } from 'ng-zorro-antd/spin';
// import { NzInputModule } from 'ng-zorro-antd/input';
// import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
// import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
// import { NzAvatarModule } from 'ng-zorro-antd/avatar';
// import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
// import { NzTypographyModule } from 'ng-zorro-antd/typography';
// import { NzIconModule } from 'ng-zorro-antd/icon';
// import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
// import { NzCardModule } from 'ng-zorro-antd/card';
// import { NzTabsModule } from 'ng-zorro-antd/tabs';
// import { NzSelectModule } from 'ng-zorro-antd/select';
// import { NzEmptyModule } from 'ng-zorro-antd/empty';
// import { NzTableModule } from 'ng-zorro-antd/table';
// import { NzTagModule } from 'ng-zorro-antd/tag';
// import { NzCollapseModule } from 'ng-zorro-antd/collapse';
// import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
// import { NzFormModule } from 'ng-zorro-antd/form';
// import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
// import { NzGridModule } from 'ng-zorro-antd/grid';
// @NgModule({
//   exports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     HttpClientModule,
//     //NgZorroAntdModule,
//     PerfectScrollbarModule,
//     AddProjectComponent,
//     OrganisationComponent,
//     TimelogComponent,
//     SearchPipe,
//     TaskListComponent,
//     LoaderComponent,
//     DateAgoPipe,
//     Safe,
//     NumericDirective,
//     AddEpicComponent,
//     ProfileNameComponent,
//     UserFilterComponent,
//     TeamCapacityComponent,
//     TeamCapacityModelComponent,
//     CloseSprintComponent,
//     NzButtonModule,
//     NzModalModule,
//     NzSpinModule,
//     NzInputModule,
//     NzBreadCrumbModule,
//     NzDropDownModule,
//     NzAvatarModule,
//     NzToolTipModule,
//     NzTypographyModule,
//     NzIconModule,
//     NzAutocompleteModule,
//     NzCardModule,
//     NzTabsModule,
//     NzSelectModule,
//     NzEmptyModule,
//     NzTableModule,
//     NzTagModule ,
//     NzCollapseModule,
//     NzCheckboxModule,
//     NzFormModule,
//     NzDatePickerModule ,
//     NzGridModule,
//     CloseSprintComponent,
//     KeysPipe,
//     AddStatusComponent,
//     NzPopoverModule,
//     SprintDetailsComponent,
//     StatusDropdownComponent
//   ],
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     //NgZorroAntdModule,
//     PerfectScrollbarModule,
//     TypeaheadModule,
//     PopoverModule,
//     //EditorModule,
//     RouterModule,
//     NzButtonModule,
//     NzModalModule,
//     NzSpinModule,
//     NzInputModule,
//     NzBreadCrumbModule,
//     NzDropDownModule,
//     NzAvatarModule,
//     NzToolTipModule,
//     NzTypographyModule,
//     NzIconModule,
//     NzAutocompleteModule,
//     NzCardModule,
//     NzTabsModule,
//     NzSelectModule,
//     NzEmptyModule,
//     NzTableModule,
//     NzTagModule ,
//     NzCollapseModule,
//     NzCheckboxModule,
//     NzFormModule,
//     NzDatePickerModule,
//     NzGridModule,
//     RouterModule,
//     ColorSketchModule,
//     NzPopoverModule,
//     QuillModule.forRoot()
//   ],
//   declarations: [
//     AddProjectComponent,
//     OrganisationComponent,
//     TimelogComponent,
//     SearchPipe,
//     TaskListComponent,
//     LoaderComponent,
//     DateAgoPipe,
//     Safe,
//     NumericDirective,
//     AddEpicComponent,
//     ProfileNameComponent,
//     KeysPipe,
//     UserFilterComponent,
//     TeamCapacityComponent,
//     TeamCapacityModelComponent,
//     CloseSprintComponent,
//     AddStatusComponent,
//     SprintDetailsComponent,
//     StatusDropdownComponent,
//   ],
//   schemas:[NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA],
// })
// export class SharedModule {
// }
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
//import { NgZorroAntdModule } from 'ng-zorro-antd';
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
import { QuillModule } from 'ngx-quill';
import { StatusDropdownComponent } from './components/status-dropdown/status-dropdown.component';


import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { EditorModule } from "@tinymce/tinymce-angular";
import { NzListModule } from 'ng-zorro-antd';
@NgModule({
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    //NgZorroAntdModule,
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
    NzButtonModule,
    NzModalModule,
    NzSpinModule,
    NzInputModule,
    NzBreadCrumbModule,
    NzDropDownModule,
    NzAvatarModule,
    NzToolTipModule,
    NzTypographyModule,
    NzIconModule,
    NzAutocompleteModule,
    NzCardModule,
    NzTabsModule,
    NzSelectModule,
    NzEmptyModule,
    NzTableModule,
    NzTagModule ,
    NzCollapseModule,
    NzCheckboxModule,
    NzFormModule,
    NzDatePickerModule ,
    NzGridModule,
    CloseSprintComponent,
    KeysPipe,
    AddStatusComponent,
    NzPopoverModule,
    SprintDetailsComponent,
    StatusDropdownComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    //NgZorroAntdModule,
    PerfectScrollbarModule,
    TypeaheadModule,
    PopoverModule,
    //EditorModule,
    RouterModule,
    NzButtonModule,
    NzModalModule,
    NzSpinModule,
    NzInputModule,
    NzBreadCrumbModule,
    NzDropDownModule,
    NzAvatarModule,
    NzToolTipModule,
    NzTypographyModule,
    NzIconModule,
    NzAutocompleteModule,
    NzCardModule,
    NzTabsModule,
    NzSelectModule,
    NzEmptyModule,
    NzTableModule,
    NzTagModule,
    NzCollapseModule,
    NzCheckboxModule,
    NzFormModule,
    NzDatePickerModule,
    NzGridModule,
    RouterModule,
    ColorSketchModule,
    NzPopoverModule,
    QuillModule.forRoot(),
    NzListModule
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
    SprintDetailsComponent,
    StatusDropdownComponent,
  ],
  schemas:[NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule {
}
