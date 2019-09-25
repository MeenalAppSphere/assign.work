import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { ThemeConstantService } from './services/theme-constant.service';
import { AddProjectComponent } from '../dashboard/modals/add-project/add-project.component';
import { SearchPipe } from './pipes/search.pipe';
import { TypeaheadModule } from 'ngx-bootstrap';
import { ValidationRegexService } from '../shared/services/validation-regex.service';
import { TaskListComponent } from './components/task-list/task-list.component';
import { AddSelectOrganization } from '../dashboard/modals/add-select-organization/add-select-organization';

@NgModule({
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgZorroAntdModule,
    PerfectScrollbarModule,
    AddProjectComponent,
    AddSelectOrganization,
    SearchPipe,
    TaskListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule,
    PerfectScrollbarModule,
    TypeaheadModule
  ],
  declarations: [
    AddProjectComponent,
    AddSelectOrganization,
    SearchPipe,
    TaskListComponent
  ],
  providers: [ThemeConstantService, ValidationRegexService]
})
export class SharedModule {}
