import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { MongoError } from 'mongodb';
import { BaseResponseModel } from '@aavantan-app/models';
import { Error } from 'mongoose';

@Catch()
export class GenericExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const resp = new BaseResponseModel();

    if (exception.response instanceof MongoError) {
      resp.errors = [{
        message: exception.response.errmsg,
        type: 'error'
      }];
      resp.status = 500;
    } else if (exception instanceof HttpException) {
      // mongoose validation errors
      if (exception.getResponse() instanceof Error.ValidationError) {
        resp.errors = [
          ...(exception.getResponse() as any).message.map(m => {
            return { type: 'error', message: m };
          })
        ];
      } else {
        // http errors
        resp.errors = [{
          message: (exception.getResponse() as any).message,
          type: 'error'
        }];
      }
    }
    resp.status = exception.getStatus();
    resp.data = null;
    resp.hasError = true;

    response.status(resp.status).json(resp);
  }

}
