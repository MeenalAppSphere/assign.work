import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ForgotComponent } from './forgot.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [{ path: '', component: ForgotComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), SharedModule],
  exports: [],
  declarations: [ForgotComponent],
  schemas:[NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA]
})
export class ForgotModule {}
