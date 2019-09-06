import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  submitForm(): void {

  }

  constructor() {
  }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      userName: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required])
    });
  }
}
