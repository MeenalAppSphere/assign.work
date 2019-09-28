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
import { ValidationRegexService } from './services/validation-regex.service';
import { TaskListComponent } from './components/task-list/task-list.component';
import { HttpWrapperService } from './services/httpWrapper.service';
import { AuthService } from './services/auth.service';
import { GeneralService } from './services/general.service';
import { LoaderComponent } from './components/loader/loader.component';
import { LoaderService } from './services/loader.service';
import { JoyrideModule } from 'ngx-joyride';

@NgModule({
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgZorroAntdModule,
    PerfectScrollbarModule,
    AddProjectComponent,
    SearchPipe,
    TaskListComponent,
    LoaderComponent
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
    SearchPipe,
    TaskListComponent,
    LoaderComponent
  ],
  providers: [
    ThemeConstantService,
    ValidationRegexService,
    HttpWrapperService,
    AuthService,
    GeneralService,
    LoaderService
  ]
})
export class SharedModule {}
