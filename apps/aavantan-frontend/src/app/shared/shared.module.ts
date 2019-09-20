import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { ThemeConstantService } from './services/theme-constant.service';
import { AddProjectComponent } from '../dashboard/modals/add-project/add-project.component';
import { SearchPipe } from './pipes/search.pipe';
import { TypeaheadModule } from 'ngx-bootstrap';
import { ValidationRegexService } from '../shared/services/validation-regex.service';

@NgModule({
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgZorroAntdModule,
    PerfectScrollbarModule,
    AddProjectComponent,
    SearchPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgZorroAntdModule,
    PerfectScrollbarModule,
    TypeaheadModule
  ],
  declarations: [
    AddProjectComponent,
    SearchPipe
  ],
  providers: [ThemeConstantService, ValidationRegexService]
})
export class SharedModule {}
