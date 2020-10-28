import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyTasksComponent } from './my-tasks.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { NgxPermissionsModule } from 'ngx-permissions';

const routes: Routes = [
  { path: '', component: MyTasksComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    NgxPermissionsModule.forChild()
  ],
  exports: [],
  declarations: [
    MyTasksComponent
  ]
})
export class MyTasksModule {
}
