import { NgModule } from '@angular/core';
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
    QuillModule.forRoot()
  ],
  exports: [],
  declarations: [
    TaskComponent,
    ActivityComponent,
    HistoryComponent,
    EditCommentComponent
  ]
})
export class TaskModule {

}
