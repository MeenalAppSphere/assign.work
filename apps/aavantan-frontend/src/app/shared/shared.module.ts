import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { ThemeConstantService } from './services/theme-constant.service';
import { AddProjectComponent } from './components/add-project/add-project.component';
import { SearchPipe } from './pipes/search.pipe';
import { PopoverModule, TypeaheadModule } from 'ngx-bootstrap';
import { ValidationRegexService } from './services/validation-regex.service';
import { TaskListComponent } from './components/task-list/task-list.component';
import { HttpWrapperService } from './services/httpWrapper.service';
import { AuthService } from './services/auth.service';
import { GeneralService } from './services/general.service';
import { LoaderComponent } from './components/loader/loader.component';
import { LoaderService } from './services/loader.service';
import { TimelogComponent } from './components/timelog/timelog.component';
import { DateAgoPipe } from './pipes/dateago.pipe';
import { UserService } from './services/user.service';
import { AuthInterceptor } from './interceptor/auth.interceptor';

@NgModule({
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgZorroAntdModule,
    PerfectScrollbarModule,
    AddProjectComponent,
    TimelogComponent,
    SearchPipe,
    TaskListComponent,
    LoaderComponent,
    DateAgoPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule,
    PerfectScrollbarModule,
    TypeaheadModule,
    PopoverModule
  ],
  declarations: [
    AddProjectComponent,
    TimelogComponent,
    SearchPipe,
    TaskListComponent,
    LoaderComponent,
    DateAgoPipe
  ],
  providers: [
    ThemeConstantService,
    ValidationRegexService,
    HttpWrapperService,
    AuthService,
    GeneralService,
    LoaderService,
    UserService
  ]
})
export class SharedModule {
}
