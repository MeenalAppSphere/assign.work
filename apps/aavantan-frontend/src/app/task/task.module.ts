import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TaskComponent } from './task.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { TypeaheadModule } from 'ngx-bootstrap';
import { ActivityComponent } from './activity/activity.component';
import { HistoryComponent } from './history/history.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { FroalaEditorModule } from 'angular-froala-wysiwyg';
import { AngularEditorModule } from '@kolkov/angular-editor';

const routes: Routes = [
  { path: '', component: TaskComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    TypeaheadModule,
    CKEditorModule,
    FroalaEditorModule,
    AngularEditorModule
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
