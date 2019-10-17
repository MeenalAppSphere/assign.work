import { ArgumentsHost, Catch, ExceptionFilter, HttpException, UnauthorizedException } from '@nestjs/common';
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

    if (exception instanceof MongoError) {
      // normal mongo errors
      resp.errors = [{
        message: exception.errmsg,
        type: 'error'
      }];
      resp.status = 500;
    } else if (exception.response instanceof MongoError) {
      // mongo duplicate error and etc...
      resp.errors = [{
        message: exception.response.errmsg,
        type: 'error'
      }];
      resp.status = 500;
    } else if (exception instanceof Error.ValidationError) {
      // mongoose validation errors
      resp.errors = [
        ...(exception as any).message.map(m => {
          return { type: 'error', message: m };
        })
      ];
      resp.status = 400;
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
      resp.status = exception.getStatus();
    } else if (exception instanceof UnauthorizedException) {
      resp.errors = [{
        message: exception.message,
        type: 'error'
      }];
      resp.status = exception.getStatus();
    } else {
      resp.errors = [{
        message: 'Something Went Wrong',
        type: 'error'
      }];
      resp.status = 500;
    }

    resp.data = null;
    resp.hasError = true;
    resp.error = resp.errors[0];

    response.status(resp.status).json(resp);
  }

}