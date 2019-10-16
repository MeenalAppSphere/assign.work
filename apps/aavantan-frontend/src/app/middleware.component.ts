import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

@Component({
  template: ''
})

export class MiddlewareComponent implements OnInit {
  constructor(private activatedRoute: ActivatedRoute, private _authService: AuthService, private router: Router) {
  }

  ngOnInit() {
    if (this.activatedRoute.snapshot.queryParams.action) {
      const action = this.activatedRoute.snapshot.queryParams.action;
      const [code, data] = action.split('<>?');
      switch (code) {
        case '1':
          // means user who is not our member for now need to go to sign-up page with emailId pre-filled
          this.router.navigate(['/sign-up'], { queryParams: { id: data } });
          break;
        case '2':
          // means user is already been member and currently login in other organization

          break;
      }
    }
  }
}
