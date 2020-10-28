import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BacklogComponent } from './backlog.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { NgxPermissionsModule } from 'ngx-permissions';

const routes: Routes = [
  { path: '', component: BacklogComponent }
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
    BacklogComponent
  ]
})
export class BacklogModule {
}
