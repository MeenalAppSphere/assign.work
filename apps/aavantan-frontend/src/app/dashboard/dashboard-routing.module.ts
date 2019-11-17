import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { BoardComponent } from './board/board.component';
import { ActivesprintComponent } from './activesprint/activesprint.component';
import { DashboardComponent } from './dashboard.component';
import { DashboardDataResolver } from '../resolver/dashboardData.resolver';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    data: {
      nzAutoGenerate: false
    },
    resolve: [DashboardDataResolver],
    children: [
      // {
      //   path: '', redirectTo: 'home', pathMatch: 'full'
      // },
      {
        path: 'home', component: HomeComponent
      },
      { path: 'project', loadChildren: () => import('../project/project.module').then(p => p.ProjectModule) },
      { path: 'board', component: BoardComponent },
      { path: 'active_sprint', component: ActivesprintComponent },
      { path: 'backlog', loadChildren: () => import('../backlog/backlog.module').then(p => p.BacklogModule) },
      { path: 'task', loadChildren: () => import('../task/task.module').then(p => p.TaskModule) },
      { path: 'settings', loadChildren: () => import('../settings/settings.module').then(p => p.SettingsModule) },
      { path: 'profile', loadChildren: () => import('../profile/profile.module').then(p => p.ProfileModule) }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {
}
