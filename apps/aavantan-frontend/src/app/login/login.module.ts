import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [{ path: '', component: LoginComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), SharedModule],
  exports: [],
  declarations: [LoginComponent]
})
export class LoginModule {}
