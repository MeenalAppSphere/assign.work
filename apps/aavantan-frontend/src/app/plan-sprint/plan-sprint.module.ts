import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanSprintComponent } from './plan-sprint.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { AddSprintComponent } from './components/add-sprint/add-sprint.component';
import { NgxPermissionsModule } from 'ngx-permissions';

const routes: Routes = [
  { path: '', component: PlanSprintComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    NgxPermissionsModule.forChild()
  ],
  exports: [],
  declarations: [
    PlanSprintComponent,
    AddSprintComponent
  ]
})
export class PlanSprintModule {
}
