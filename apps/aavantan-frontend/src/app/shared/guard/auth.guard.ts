import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { AuthQuery } from '../../queries/auth/auth.query';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private readonly authQuery: AuthQuery) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const isLoggedIn = !!this.authQuery.getValue().token;

    if (!isLoggedIn) {
      this.router.navigate(['/login']);
    }
    return true;
  }
}
