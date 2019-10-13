import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthQuery } from '../queries/auth/auth.query';
import { UserService } from '../shared/services/user.service';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DashboardDataResolver implements Resolve<any> {

  constructor(private readonly authQuery: AuthQuery, private readonly _userService: UserService) {

  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    const token = this.authQuery.getValue().token;
    if (token) {
      return this._userService.getProfile().pipe(
        catchError((err) => {
          return EMPTY;
        })
      );
    }
  }
}
