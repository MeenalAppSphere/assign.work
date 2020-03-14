import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { SortableModule, TypeaheadModule } from 'ngx-bootstrap';
import { AddPriorityComponent } from './add-priority/add-priority.component';
import { AddStatusComponent } from './add-status/add-status.component';
import { AddTaskTypeComponent } from './add-task-type/add-task-type.component';

const routes: Routes = [
  { path: '', component: SettingsComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    TypeaheadModule,
    SortableModule
  ],
  exports: [
    AddStatusComponent
  ],
  declarations: [
    SettingsComponent,
    AddStatusComponent,
    AddPriorityComponent,
    AddTaskTypeComponent
  ]
})
export class SettingsModule {
}
