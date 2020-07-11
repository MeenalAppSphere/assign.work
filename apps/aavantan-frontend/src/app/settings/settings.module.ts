import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { SortableModule, TypeaheadModule } from 'ngx-bootstrap';
import { AddPriorityComponent } from './add-priority/add-priority.component';
import { AddStatusComponent } from '../shared/components/add-status/add-status.component';
import { AddTaskTypeComponent } from './add-task-type/add-task-type.component';
import { ColorSketchModule } from 'ngx-color/sketch';
import { MoveStatusComponent } from './move-status/move-status.component';
import { UpdateUserRoleComponent } from './update-user-role/update-user-role.component';
import { NgxPermissionsGuard, NgxPermissionsModule } from 'ngx-permissions';

const routes: Routes = [
  {
    path: '', component: SettingsComponent,
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    TypeaheadModule,
    SortableModule,
    ColorSketchModule,
    NgxPermissionsModule.forChild()
  ],
  exports: [],
  declarations: [
    SettingsComponent,
    AddPriorityComponent,
    AddTaskTypeComponent,
    MoveStatusComponent,
    UpdateUserRoleComponent
  ]
})
export class SettingsModule {
}
