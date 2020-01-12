import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Notice } from '../shared/interfaces/notice.type';
import { AuthService } from '../shared/services/auth.service';
import { AuthQuery } from '../queries/auth/auth.query';
import { ActivatedRoute, Router } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { AuthService as SocialAuthService, GoogleLoginProvider } from 'angularx-social-login';
import { ValidationRegexService } from '../shared/services/validation-regex.service';

@Component({
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  public signUpForm: FormGroup;
  public registerInProcess = false;
  public responseMessage: Notice;
  public isInvitedLink: boolean = false;

  constructor(private readonly _authService: AuthService,
              private readonly _authQuery: AuthQuery,
              private router: Router,
              private activatedRoute: ActivatedRoute,
              private socialAuthService: SocialAuthService,
              private validationRegexService: ValidationRegexService) {
  }

  ngOnInit(): void {

    this.signUpForm = new FormGroup({
      firstName: new FormControl(null, [Validators.required]),
      lastName: new FormControl(null, [Validators.required]),
      emailId: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required]),
      checkPassword: new FormControl(null, [
        Validators.required,
        this.confirmationValidator
      ]),
      agree: new FormControl(false),
      invitationId: new FormControl(null)
    });

    const queryParams = this.activatedRoute.snapshot.queryParams;
    if (queryParams && queryParams.emailId && queryParams.invitationId) {

      if (!this.validationRegexService.emailValidator(queryParams.emailId).invalidEmailAddress) {
        this.signUpForm.get('emailId').patchValue(queryParams.emailId);
        this.signUpForm.get('emailId').disable();
        this.signUpForm.get('invitationId').patchValue(queryParams.invitationId);

        this.isInvitedLink = true;
      } else {
        this.isInvitedLink = false;
      }
    }

    this._authQuery.isRegisterInProcess$.pipe(untilDestroyed(this)).subscribe(res => {
      this.registerInProcess = res;
    });

    // auth state subscriber if user and user token found then verify that token and re-login user
    this.socialAuthService.authState.pipe(untilDestroyed(this)).subscribe((user) => {
      if (user) {
        this._authService.googleSignIn(user.idToken, queryParams.invitationId).subscribe();
      }
    });
  }

  submitForm(): void {
    this._authService.register(this.signUpForm.getRawValue()).subscribe();
  }


  loginWithGoogle() {
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then(result => {
    }).catch(err => {
      console.log(err);
    });
  }

  updateConfirmValidator(): void {
    Promise.resolve().then(() =>
      this.signUpForm.controls.checkPassword.updateValueAndValidity()
    );
  }

  confirmationValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { required: true };
    } else if (control.value !== this.signUpForm.controls.password.value) {
      return { confirm: true, error: true };
    }
  };

  ngOnDestroy(): void {
  }

}
