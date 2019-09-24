import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent implements OnInit {
  forgotForm: FormGroup;

  submitForm(): void {
    console.log(this.forgotForm);
    if(!this.forgotForm.invalid){

    }
  }


  constructor() {}

  ngOnInit(): void {
    this.forgotForm = new FormGroup({
      emailId: new FormControl(null, [Validators.required])
    });
  }
}
