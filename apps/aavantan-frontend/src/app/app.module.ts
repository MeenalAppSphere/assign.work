import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { en_US, NZ_I18N } from 'ng-zorro-antd';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { AppComponent } from './app.component';
import { ThemeConstantService } from './shared/services/theme-constant.service';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { environment } from '../environments/environment';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './shared/interceptor/auth.interceptor';
import { ServiceModule } from './shared/services/service.module';
import { EditorModule } from '@tinymce/tinymce-angular';
import { AuthServiceConfig, GoogleLoginProvider, SocialLoginModule } from 'angularx-social-login';
import { DndModule } from 'ngx-drag-drop';
import { NzConfig, NZ_CONFIG } from 'ng-zorro-antd/core/config';


registerLocaleData(en);

// const googleLoginOptions: LoginOpt = {
//   scope: 'profile email'
// };
const ngZorroConfig: NzConfig = {
  message: { nzTop: 120 },
  notification: { nzTop: 240 }
};

const config = new AuthServiceConfig([
  {
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider(environment.googleApi)
  }
]);

export function provideConfig() {
  return config;
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    SharedModule,
    ServiceModule.forRoot(),
    environment.production ? [] : AkitaNgDevtools.forRoot(),
    EditorModule,
    SocialLoginModule,
    DndModule
  ],
  providers: [
    {
      provide: NZ_I18N,
      useValue: en_US
    },
    { provide: NZ_CONFIG, useValue: ngZorroConfig },
    {
      provide: AuthServiceConfig,
      useFactory: provideConfig
    },
    ThemeConstantService,
    {
      provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true
    }
  ],
   schemas:[NO_ERRORS_SCHEMA,CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {
}
