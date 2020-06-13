import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { NzNotificationService } from 'ng-zorro-antd';
import { GeneralService } from './shared/services/general.service';

@Component({
  selector: 'aavantan-app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  public isLoading: boolean = false;

  constructor(private router: Router) {
  }

  ngOnInit(): void {

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
  }

}
