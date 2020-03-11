import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { BaseResponseModel } from '@aavantan-app/models';
import { map, tap } from 'rxjs/operators';
import { GeneralService } from '../services/general.service';
import * as moment from 'moment';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, BaseResponseModel<T>> {

  constructor(private readonly _generalService: GeneralService) {
  }

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<BaseResponseModel<T>> | Promise<Observable<BaseResponseModel<T>>> {
    return next.handle()
      .pipe(
        tap(() => {
          const http = context.switchToHttp();
          const headers = http.getRequest().headers;

          // set locale based on request header from browser
          this._generalService.locale = headers['accept-language'];
          moment.locale(this._generalService.locale);

        }),
        map(m => {
          const newResponse = new BaseResponseModel<T>();
          newResponse.data = m;
          newResponse.hasError = false;
          newResponse.errors = null;
          return newResponse;
        })
      );
  }
}
