import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RunningSprintComponent } from './running-sprint/running-sprint.component';
import { ActivesprintComponent } from './activesprint/activesprint.component';
import { DashboardComponent } from './dashboard.component';
import { DashboardDataResolver } from '../resolver/dashboardData.resolver';
import { BoardDesignComponent } from './board-design/board-design.component';
import { NoAccessComponent } from './not-found/no-access.component';
import { NgxPermissionsGuard } from 'ngx-permissions';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: {
      nzAutoGenerate: false
    },
    resolve: [DashboardDataResolver],
    children: [
      {
        path: '', redirectTo: '', pathMatch: 'full', component: HomeComponent
      },
      {
        path: 'dashboard', component: HomeComponent
      },
      { path: 'my-tasks', loadChildren: () => import('../my-tasks/my-tasks.module').then(p => p.MyTasksModule) },
      { path: 'running-sprint', component: RunningSprintComponent },
      { path: 'board-setting', component: BoardDesignComponent },
      { path: 'board-setting/:boardId', component: BoardDesignComponent },
      { path: 'active_sprint', component: ActivesprintComponent },
      { path: 'no-access', component: NoAccessComponent },
      {
        path: 'plan-sprint',
        loadChildren: () => import('../plan-sprint/plan-sprint.module').then(p => p.PlanSprintModule)
      },
      { path: 'backlog', loadChildren: () => import('../backlog/backlog.module').then(p => p.BacklogModule) },
      { path: 'task', loadChildren: () => import('../task/task.module').then(p => p.TaskModule) },
      {
        path: 'settings',
        loadChildren: () => import('../settings/settings.module').then(p => p.SettingsModule),
      },
      {
        path: 'profile', loadChildren: () => import('../profile/profile.module').then(p => p.ProfileModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {
}
