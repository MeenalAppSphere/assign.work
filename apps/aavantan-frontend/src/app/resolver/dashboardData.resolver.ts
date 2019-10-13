import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthQuery } from '../queries/auth/auth.query';
import { UserService } from '../shared/services/user.service';
import { catchError } from 'rxjs/operators';
import { GeneralService } from '../shared/services/general.service';

@Injectable({ providedIn: 'root' })
export class DashboardDataResolver implements Resolve<any> {

  constructor(private readonly authQuery: AuthQuery, private readonly _userService: UserService, private _generalService: GeneralService) {

  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    const token = this.authQuery.getValue().token;
    if (token) {
      this._generalService.token = token;
      return this._userService.getProfile().pipe(
        catchError((err) => {
          return EMPTY;
        })
      );
    }
  }
}
