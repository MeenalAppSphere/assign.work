import { NgModule } from '@angular/core';
import { LayoutComponent } from './layout.component';
import { TemplateModule } from '../shared/template/template.module';
import { LayoutRoutingModule } from './layout.routing.module';
import { CommonModule } from '@angular/common';
import { NzBreadCrumbModule } from 'ng-zorro-antd';
import { RouterModule } from '@angular/router';


@NgModule({
  imports: [
    TemplateModule,
    LayoutRoutingModule,
    CommonModule,
    NzBreadCrumbModule,
    RouterModule
  ],
  exports: [],
  declarations: [
    LayoutComponent
  ],
  providers: []
})
export class LayoutModule {
}
