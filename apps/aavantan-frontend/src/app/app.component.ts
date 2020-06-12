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

  constructor(private router: Router, private socket: Socket, private generalService: GeneralService) {
  }

  ngOnInit(): void {
    Notification.requestPermission();

    this.socket.emit('connect-task', this.generalService.user._id);

    // task created
    this.socket.on('task-created', (res: { msg: string, link: string }) => {
      const notification = new Notification('Task Created', {
        body: res.msg
      });

      notification.onclick = ((ev: Event) => {
        this.router.navigateByUrl(res.link);
      });
    });

    // task updated
    this.socket.on('task-updated', (res: { msg: string, link: string }) => {
      const notification = new Notification('Task Updated', {
        body: res.msg
      });

      notification.onclick = ((ev: Event) => {
        this.router.navigateByUrl(res.link);
      });
    });

    // comment added
    this.socket.on('comment-added', (res: { msg: string, link: string }) => {
      const notification = new Notification('Comment Added', {
        body: res.msg
      });

      notification.onclick = ((ev: Event) => {
        this.router.navigateByUrl(res.link);
      });
    });

    // comment updated
    this.socket.on('comment-updated', (res: { msg: string, link: string }) => {
      const notification = new Notification('Comment Updated', {
        body: res.msg
      });

      notification.onclick = ((ev: Event) => {
        this.router.navigateByUrl(res.link);
      });
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.socket.emit('disconnect');
  }

}
