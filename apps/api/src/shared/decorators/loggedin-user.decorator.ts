import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@aavantan-app/models';


/**
 * get current user from request object
 * @type {(...dataOrPipes: Type<PipeTransform> | PipeTransform | any[]) => ParameterDecorator}
 */
export const LoggedInUser = createParamDecorator((data, req): Partial<User> => {
  return req.user;
});
