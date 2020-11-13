import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskComponent } from './task.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { ActivityComponent } from './activity/activity.component';
import { HistoryComponent } from './history/history.component';
import { EditCommentComponent } from './edit-comment/edit-comment.component';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { QuillModule } from 'ngx-quill';
import { NgxPermissionsModule } from 'ngx-permissions';
import { NzListModule, NzProgressModule } from 'ng-zorro-antd';

const routes: Routes = [
  { path: '', component: TaskComponent },
  { path: ':displayName', component: TaskComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    TypeaheadModule,
    NzPopoverModule,
    QuillModule.forRoot(),
    NgxPermissionsModule.forChild(),
    NzProgressModule,
    NzListModule
  ],
  exports: [

  ],
  declarations: [
    TaskComponent,
    ActivityComponent,
    HistoryComponent,
    EditCommentComponent
  ],
  schemas:[NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA]
})
export class TaskModule {

}
