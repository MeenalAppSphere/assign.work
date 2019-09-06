import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RegisterComponent } from './register.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [{ path: '', component: RegisterComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), SharedModule],
  exports: [],
  declarations: [RegisterComponent]
})
export class RegisterModule {}
