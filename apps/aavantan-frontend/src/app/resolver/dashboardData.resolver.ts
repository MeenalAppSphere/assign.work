import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthQuery } from '../queries/auth/auth.query';

@Injectable({ providedIn: 'root' })
export class DashboardDataResolver implements Resolve<any> {

  constructor(private readonly authQuery: AuthQuery) {

  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    const token = this.authQuery.getValue().token;
    if (token) {

    }
  }
}
