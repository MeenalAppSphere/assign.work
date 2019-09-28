import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Notice } from '../shared/interfaces/notice.type';

@Component({
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent implements OnInit {
  public forgotForm: FormGroup;
  public loading: Boolean = false;
  public responseMessage: Notice;

  submitForm(): void {
    this.loading=true;
    if(!this.forgotForm.invalid){
      setTimeout(()=>{this.responseMessage={message:'Please check your email to reset password.', type:'success'};this.loading=false},1000);
    }
  }


  constructor() {}

  ngOnInit(): void {
    this.forgotForm = new FormGroup({
      emailId: new FormControl(null, [Validators.required])
    });
  }
}
