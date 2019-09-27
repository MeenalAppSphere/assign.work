import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { en_US, NZ_I18N } from 'ng-zorro-antd';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';
import { ThemeConstantService } from './shared/services/theme-constant.service';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { MiddlewareComponent } from './middleware.component';

registerLocaleData(en);

@NgModule({
  declarations: [AppComponent, MiddlewareComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    SharedModule,
    TypeaheadModule.forRoot()
  ],
  providers: [
    {
      provide: NZ_I18N,
      useValue: en_US
    },
    ThemeConstantService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
