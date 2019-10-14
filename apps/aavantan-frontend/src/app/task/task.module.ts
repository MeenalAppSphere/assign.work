import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskComponent } from './task.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { TypeaheadModule } from 'ngx-bootstrap';
import { ActivityComponent } from './activity/activity.component';
import { HistoryComponent } from './history/history.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

const routes: Routes = [
  { path: '', component: TaskComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    TypeaheadModule,
    CKEditorModule
  ],
  exports: [],
  declarations: [
    TaskComponent,
    ActivityComponent,
    HistoryComponent
  ]
})
export class TaskModule {
}
