import { Store } from '@datorama/akita';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseResponseModel } from '@aavantan-app/models';
import { NzNotificationService } from 'ng-zorro-antd';
import { throwError } from 'rxjs';

export class BaseService<S extends Store, St> {
  constructor(protected store: S, protected notification: NzNotificationService) {
  }

  protected updateState(model: Partial<St>) {
    this.store.update((state) => {
      return {
        ...state,
        ...model
      };
    });
  }

  protected handleError<TResponse>(r: HttpErrorResponse) {
    const error: BaseResponseModel<TResponse> = r.error;
    this.notification.error('Error', error.message);
    return throwError(error);
  }
}
