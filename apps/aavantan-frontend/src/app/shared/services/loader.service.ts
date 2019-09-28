import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoaderService {

  public loaderSubject = new BehaviorSubject<{ show: boolean }>({show: false});
  public loaderState = this.loaderSubject;

  public show() {
    this.loaderSubject.next({show: true});
  }

  public hide() {
    this.loaderSubject.next({show: false});
  }
}
