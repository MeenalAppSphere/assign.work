import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { MongoError } from 'mongodb';
import { BaseResponseModel } from '@aavantan-app/models';

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
      resp.status = 404;
    } else if (exception.response instanceof HttpException) {
      // http exception includes mongoose validation errors
      resp.errors = [{
        message: exception.response.message,
        type: 'error'
      }];
    }
    resp.status = exception.getStatus();
    resp.data = null;
    resp.hasError = true;

    response.status(resp.status).json(resp);
  }

}
