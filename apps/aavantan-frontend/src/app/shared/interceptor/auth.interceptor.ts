import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent, HttpResponse } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map(event => {
        if (event instanceof HttpResponse) {
          if (event.status === 401) {
            // means redirection occurs from server side please handle this by changing url
            this.authService.logOut();
          }
        }
        return event;
      }),
      catchError(err => {
        if (err && err.status === 401) {
          this.authService.logOut();
        }
        return EMPTY;
      })
    );
  }
}
