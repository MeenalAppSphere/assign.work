import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { catchError } from 'rxjs/operators';

@Component({
  template: ''
})

export class MiddlewareComponent implements OnInit {
  constructor(private router: ActivatedRoute, private _authService: AuthService, private route: Router) {
  }

  ngOnInit() {
    if (this.router.snapshot.queryParams.code) {
      this._authService.googleSignIn(this.router.snapshot.queryParams.code)
        .subscribe((params: Params) => {
          this.route.navigate(['/']);
        });
    }
  }
}
