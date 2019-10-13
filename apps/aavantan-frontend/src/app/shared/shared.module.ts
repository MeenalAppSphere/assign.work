import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { AddProjectComponent } from './components/add-project/add-project.component';
import { SearchPipe } from './pipes/search.pipe';
import { PopoverModule, TypeaheadModule } from 'ngx-bootstrap';
import { TaskListComponent } from './components/task-list/task-list.component';
import { LoaderComponent } from './components/loader/loader.component';
import { TimelogComponent } from './components/timelog/timelog.component';
import { DateAgoPipe } from './pipes/dateago.pipe';
import { ServiceModule } from './service.module';

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
  ]
})
export class SharedModule {
}
