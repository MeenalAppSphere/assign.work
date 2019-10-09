import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { AuthQuery } from '../queries/auth/auth.query';
import { Router } from '@angular/router';
import { Notice } from '../shared/interfaces/notice.type';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit, OnDestroy {
  public loginForm: FormGroup;
  public loginInProcess = false;
  public responseMessage: Notice;

  constructor(private _authService: AuthService, private _authQuery: AuthQuery, private router: Router) {
  }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      emailId: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required])
    });

    this._authQuery.token$.pipe(untilDestroyed(this)).subscribe(token => {
      if (token) {
        this.router.navigate(['/dashboard']);
      }
    });

    this._authQuery.isLoginInProcess$.pipe(untilDestroyed(this)).subscribe(res => {
      this.loginInProcess = res;
    })

  }

  loginWithGoogle() {
    this._authService.requestGoogleRedirectUri().subscribe(res => {
      window.location.replace(res.redirect_uri);
    });
  }

  submitForm() {
    this._authService.login(this.loginForm.value).subscribe();
  }

  ngOnDestroy(): void {
  }
}
