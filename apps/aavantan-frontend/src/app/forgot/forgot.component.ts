import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Notice } from '../shared/interfaces/notice.type';
import { AuthService } from '../shared/services/auth.service';
import { AuthQuery } from '../queries/auth/auth.query';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Observable } from 'rxjs';

@Component({
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent implements OnInit, OnDestroy {
  public forgotPasswordForm: FormGroup;
  public resetPasswordForm: FormGroup;
  public responseMessage: Notice;
  public isForgotPasswordInProcess: Observable<boolean>;
  public isForgotPasswordSuccess: Observable<boolean>;
  public isResetPasswordInProcess: Observable<boolean>;
  public isResetPasswordSuccess: Observable<boolean>;

  constructor(private _authService: AuthService, private _authQuery: AuthQuery) {
    this.isForgotPasswordInProcess = this._authQuery.isForgotPasswordInProcess$;
    this.isForgotPasswordSuccess = this._authQuery.isForgotPasswordSuccess$;
    this.isResetPasswordInProcess = this._authQuery.isResetPasswordInProcess$;
    this.isResetPasswordSuccess = this._authQuery.isResetPasswordSuccess$;
  }

  forgotPassword(): void {
    this._authService.forgotPassword(this.forgotPasswordForm.value.emailId).subscribe();
  }

  resetPassword(): void {
    this._authService.resetPassword(this.resetPasswordForm.getRawValue()).subscribe();
  }


  ngOnInit(): void {

    this.isForgotPasswordSuccess.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.resetPasswordForm.get('emailId').patchValue(this.forgotPasswordForm.value.emailId);
        this.resetPasswordForm.get('emailId').disable();
      }
    });

    this.forgotPasswordForm = new FormGroup({
      emailId: new FormControl(null, [Validators.required, Validators.email])
    });

    this.resetPasswordForm = new FormGroup({
      code: new FormControl(null, [Validators.required]),
      emailId: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [Validators.required])
    });
  }

  ngOnDestroy(): void {
  }
}
