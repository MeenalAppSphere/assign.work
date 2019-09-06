import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  signUpForm: FormGroup;

  submitForm(): void {}

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

  constructor() {}

  ngOnInit(): void {
    this.signUpForm = new FormGroup({
      userName: new FormControl(null, [Validators.required]),
      email: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required]),
      checkPassword: new FormControl(null, [
        Validators.required,
        this.confirmationValidator
      ]),
      agree: new FormControl(false)
    });
  }
}
