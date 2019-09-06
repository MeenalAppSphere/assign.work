import { ReplaySubject } from 'rxjs';

export class BaseComponent {
  protected destroyed$: ReplaySubject<boolean> = new ReplaySubject<boolean>();

  protected destroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}
