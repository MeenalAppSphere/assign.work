import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class RedirectInterceptor implements HttpInterceptor {
  constructor() {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map(event => {
        if (event instanceof HttpResponse) {
          if (event.status === 302) {
            // means redirection occurs from server side please handle this by changing url
            window.location.href = event.body;
            return;
          }
        }
        return event;
      })
    );
  }
}
