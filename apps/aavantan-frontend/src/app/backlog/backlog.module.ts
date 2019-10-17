import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BacklogComponent } from './backlog.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { TeamCapacityComponent } from './components/team-capacity.component';

const routes: Routes = [
  { path: '', component: BacklogComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ],
  exports: [],
  declarations: [
    BacklogComponent,
    TeamCapacityComponent
  ]
})
export class BacklogModule {
}
