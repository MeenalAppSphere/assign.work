import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ForgotComponent } from './forgot.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [{ path: '', component: ForgotComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), SharedModule],
  exports: [],
  declarations: [ForgotComponent]
})
export class ForgotModule {}
