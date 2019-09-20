import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProjectComponent } from './project/project.component';
import { BoardComponent } from './board/board.component';
import { ActivesprintComponent } from './activesprint/activesprint.component';
import { BacklogComponent } from './backlog/backlog.component';
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
    data:{
      nzAutoGenerate:false
    },
    children: [
      {
        path: 'dashboard', redirectTo: 'dashboard', pathMatch: 'full'
      },
      { path: 'project', redirectTo: 'dashboard/project', pathMatch: 'full', component: ProjectComponent },
      { path: 'board', redirectTo: 'dashboard/board', pathMatch: 'full', component: BoardComponent },
      { path: 'active_sprint', redirectTo: 'dashboard/active-sprint', pathMatch: 'full', component: ActivesprintComponent },
      { path: 'backlog', redirectTo: 'dashboard/backlog', pathMatch: 'full', component: BacklogComponent },
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DashboardRoutingModule { }
