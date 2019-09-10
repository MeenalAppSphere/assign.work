import { NgModule } from '@angular/core';
import { LayoutComponent } from './layout.component';
import { TemplateModule } from '../shared/template/template.module';
import { LayoutRoutingModule } from './layout.routing.module';


@NgModule({
  imports: [
    TemplateModule,
    LayoutRoutingModule
  ],
  exports: [],
  declarations: [
    LayoutComponent
  ],
  providers: []
})
export class LayoutModule {
}
