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
          newResponse.status = 200;
          return newResponse;
        }),
        catchError(err => {
          return of(err);
        })
      );
  }
}

// export interface Response<T> {
//   data: T;
// }

// @Injectable()
// export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
//     return next.handle().pipe(map(data => ({ data })));
//   }
// }
