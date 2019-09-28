import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { catchError } from 'rxjs/operators';

@Component({
  template: ''
})

export class MiddlewareComponent implements OnInit {
  constructor(private router: ActivatedRoute, private _authService: AuthService) {
  }

  ngOnInit() {
    debugger;
    if (this.router.snapshot.queryParams.code) {
      this._authService.googleSignIn(this.router.snapshot.queryParams.code).subscribe((res) => {
        debugger;
      }, (error => {
        console.log(error);
      }));
    }
  }
}
