import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { enableAkitaProdMode, persistState } from '@datorama/akita';
import { debounceTime } from 'rxjs/operators';

if (environment.production) {
  enableProdMode();
  enableAkitaProdMode();
}

persistState({ include: ['auth.token'], preStorageUpdateOperator: () => debounceTime(2000) });

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
