import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from '../shared/shared.module';
import { DashboardRoutingModule } from "./dashboard-routing.module";
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { HomeComponent } from './home/home.component';
import { ProjectComponent } from './project/project.component';
import { BoardComponent } from './board/board.component';
import { ActivesprintComponent } from './activesprint/activesprint.component';
import { BacklogComponent } from './backlog/backlog.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        DashboardRoutingModule
    ],
    exports: [],
    declarations: [
      HomeComponent,
      ProjectComponent,
      BoardComponent,
      ActivesprintComponent,
      BacklogComponent
    ],
    providers: [
        ThemeConstantService
    ],
})
export class DashboardModule { }
