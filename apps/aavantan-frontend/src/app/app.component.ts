import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { NzConfigService, NzNotificationService } from 'ng-zorro-antd';

@Component({
  selector: 'aavantan-app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('nzIndicatorTpl', { static: true })
  nzIndicator!: TemplateRef<void>;
  public isLoading: boolean = false;

  constructor(private router: Router, private nzNotification: NzNotificationService,
    private readonly nzConfigService: NzConfigService) {
    if ('Notification' in window) {
      Notification.requestPermission();
      // if (Notification.permission !== 'granted') {
      //   this.requestNotification();
      // }
    } else {
      this.nzNotification.info('Assign Work', 'Your browser don\'t supports notification, please update to latest one');
    }
  }

  ngOnInit(): void {

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isLoading = false;
      }
    });
    this.nzConfigService.set('spin', { nzIndicator: this.nzIndicator });
  }

  requestNotification() {
    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') {
        this.nzNotification.info('Assign Work', `Notification is not granted, please allow notification ,
        either you want receive any notifications!  please reload the page if you want to allow notifications`);
      }
    }).catch(e => {
      this.nzNotification.info('Assign Work', `Notification is not granted, please allow notification ,
        either you want receive any notifications!  please reload the page if you want to allow notifications`);
    });
  }

  ngOnDestroy(): void {
  }

}
