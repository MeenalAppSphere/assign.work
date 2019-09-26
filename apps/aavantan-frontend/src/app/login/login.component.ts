import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { UserLoginWithPasswordRequest } from '@aavantan-app/models';
import { AuthQuery } from '../queries/auth/auth.query';
import { Router } from '@angular/router';
import { untilDestroyed } from '@ngneat/until-destroy';

@Component({
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(private _authService: AuthService, private _authQuery: AuthQuery, private router: Router) {
  }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      emailId: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required])
    });

    this._authQuery.token$.pipe().subscribe(token => {
      if (token) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  submitForm() {
    this._authService.login(this.loginForm.value);
  }
}
