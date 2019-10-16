import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BacklogComponent } from './backlog.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { TeamCapabilityComponent } from './components/team-capability.component';

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
    TeamCapabilityComponent
  ]
})
export class BacklogModule {
}
