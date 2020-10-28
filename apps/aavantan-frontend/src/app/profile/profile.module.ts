import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  { path: '', component: ProfileComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
  ],
  exports: [],
  declarations: [
    ProfileComponent
  ],
  schemas:[NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfileModule {
}
