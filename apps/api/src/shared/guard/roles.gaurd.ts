import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    // if no roles is defined then allow access
    if (!roles) {
      return true;
    }

    // get request from http request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const isPermitted = user.role.accessPermissions[roles[0]][roles[1]];

    // check if user have appropriate role for accessing this route
    return isPermitted;
  }
}
