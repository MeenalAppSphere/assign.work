import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { SortableModule, TypeaheadModule } from 'ngx-bootstrap';
import { AddPriorityComponent } from './add-priority/add-priority.component';
import { AddStatusComponent } from './add-status/add-status.component';
import { AddTaskTypeComponent } from './add-task-type/add-task-type.component';
import { ColorSketchModule } from 'ngx-color/sketch';
import { MoveStatusComponent } from './move-status/move-status.component';
import { UpdateUserRoleComponent } from './update-user-role/update-user-role.component';
import { NgxPermissionsGuard, NgxPermissionsRestrictStubModule } from 'ngx-permissions';

const routes: Routes = [
  {
    path: '', component: SettingsComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: ['canView_settingsMenu'],
        redirectTo: 'dashboard/no-access'
      }
    }
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
    NgxPermissionsRestrictStubModule
  ],
  exports: [
    AddStatusComponent
  ],
  declarations: [
    SettingsComponent,
    AddStatusComponent,
    AddPriorityComponent,
    AddTaskTypeComponent,
    MoveStatusComponent,
    UpdateUserRoleComponent
  ]
})
export class SettingsModule {
}
