import { Store } from '@datorama/akita';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseResponseModel } from '@aavantan-app/models';
import { NzNotificationService } from 'ng-zorro-antd';
import { throwError } from 'rxjs';

export class BaseService<S extends Store, St> {
  constructor(protected store: S, protected notification: NzNotificationService) {
  }

  /**
   * update state helper method
   * @param model
   */
  protected updateState(model: Partial<St>) {
    this.store.update((state) => {
      return {
        ...state,
        ...model
      };
    });
  }

  /**
   * update state with previous state
   * get's a function as parameter and calls that function and passes the state as parameter
   * @param callback
   */
  protected updateStateWithPreviousState(callback: Function) {
    this.store.update((state => {
      return callback(state);
    }));
  }

  /**
   * generic handle error function
   * shows notification and throws down the error
   * @param response
   */
  protected handleError<TResponse>(response: HttpErrorResponse) {
    const error: BaseResponseModel<TResponse> = response.error;
    this.notification.error('Error', error.message);
    return throwError(error);
  }
}
