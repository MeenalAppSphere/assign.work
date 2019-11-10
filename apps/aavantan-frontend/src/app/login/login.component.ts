import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { AuthQuery } from '../queries/auth/auth.query';
import { Router } from '@angular/router';
import { Notice } from '../shared/interfaces/notice.type';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserLoginWithPasswordRequest } from '@aavantan-app/models';
import { hashSync } from 'bcrypt';

@Component({
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit, OnDestroy {
  public loginForm: FormGroup;
  public loginInProcess = false;
  public responseMessage: Notice = {};
  public isSubmitted: boolean;

  constructor(private _authService: AuthService, private _authQuery: AuthQuery, private router: Router) {
  }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      emailId: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required])
    });

    this._authQuery.isLoginInProcess$.pipe(untilDestroyed(this)).subscribe(res => {
      this.loginInProcess = res;
    });

    this._authQuery.isLoginSuccess$.pipe(untilDestroyed(this)).subscribe(res => {
      if (this.isSubmitted && !res) {
        this.responseMessage.message = 'Invalid credentials';
        this.responseMessage.type = 'danger';
      }
    });

  }

  loginWithGoogle() {
    this._authService.requestGoogleRedirectUri().subscribe(res => {
      window.location.replace(res.redirect_uri);
    });
  }

  submitForm() {
    // const request = new UserLoginWithPasswordRequest();
    // request.emailId = this.loginForm.value.emailId;
    // request.password = hashSync(this.loginForm.value.password, 5);

    this.isSubmitted = true;
    this._authService.login(this.loginForm.value).subscribe();
  }

  ngOnDestroy(): void {
  }
}
