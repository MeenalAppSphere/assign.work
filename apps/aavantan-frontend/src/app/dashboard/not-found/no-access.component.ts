import { Component, OnInit } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { Router } from '@angular/router';

@Component({
  templateUrl: './no-access.component.html'
})

export class NoAccessComponent implements OnInit {

  constructor(private router: Router, private permissionsService:NgxPermissionsService){ }

  ngOnInit (){

    // if someone access direct this link and they have permission
    this.permissionsService.permissions$.subscribe((permission) => {
      if(permission.canView_settingsMenu){
        this.router.navigateByUrl('dashboard');
      }
    });
  }

}
