import { ModuleWithProviders, NgModule } from '@angular/core';
import { ThemeConstantService } from './services/theme-constant.service';
import { ValidationRegexService } from './services/validation-regex.service';
import { HttpWrapperService } from './services/httpWrapper.service';
import { AuthService } from './services/auth.service';
import { GeneralService } from './services/general.service';
import { LoaderService } from './services/loader.service';
import { UserService } from './services/user.service';
import { OrganizationService } from './services/organization.service';

@NgModule()
export class ServiceModule {

  public static forRoot(): ModuleWithProviders {
    return {
      ngModule: ServiceModule,
      providers: [
        ThemeConstantService,
        ValidationRegexService,
        HttpWrapperService,
        AuthService,
        GeneralService,
        LoaderService,
        UserService,
        OrganizationService
      ]
    };
  }

}
