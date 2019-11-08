import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MiddlewareComponent } from './middleware.component';
import { AuthGuard } from './shared/guard/auth.guard';
import { DashboardDataResolver } from './resolver/dashboardData.resolver';

const appRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginModule)
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./register/register.module').then(m => m.RegisterModule)
  },
  {
    path: 'forgot',
    loadChildren: () =>
      import('./forgot/forgot.module').then(m => m.ForgotModule)
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'middleware',
    component: MiddlewareComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {
      useHash: false,
      scrollPositionRestoration: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
