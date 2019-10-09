import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { BaseResponseModel } from '@aavantan-app/models';
import { catchError, map } from 'rxjs/operators';

export class ResponseInterceptor<T> implements NestInterceptor<T, BaseResponseModel<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<BaseResponseModel<T>> | Promise<Observable<BaseResponseModel<T>>> {
    return next.handle()
      .pipe(
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
