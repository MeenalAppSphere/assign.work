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
import { MiddlewareComponent } from './middleware.component';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './shared/interceptor/auth.interceptor';
import { ServiceModule } from './shared/services/apiUrls/service.module';

registerLocaleData(en);

@NgModule({
  declarations: [AppComponent, MiddlewareComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    SharedModule,
    ServiceModule.forRoot(),
    environment.production ? [] : AkitaNgDevtools.forRoot()
  ],
  providers: [
    {
      provide: NZ_I18N,
      useValue: en_US
    },
    ThemeConstantService,
    {
      provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
