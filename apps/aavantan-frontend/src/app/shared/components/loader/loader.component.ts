import { takeUntil } from 'rxjs/operators';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ReplaySubject, Observable, of } from 'rxjs';
import { LoaderService } from '../../services/loader.service';
// import { AppState } from 'app/store';
// import { Store } from '@ngrx/store';
import { Router, NavigationStart, NavigationEnd, RouteConfigLoadEnd } from '@angular/router';

@Component({
  selector: 'app-aavantan-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoaderComponent implements OnInit, OnDestroy, OnChanges {

  public showLoader: Boolean = false;
  public accountInProgress$: Observable<boolean> = of(false);
  public transactionInprogress$: Observable<boolean> = of(false);
  public navigationEnd$: Observable<boolean> = of(true);

  private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

  constructor(
    private loaderService: LoaderService,
    private cdref: ChangeDetectorRef,
    // private store: Store<AppState>,
    private router: Router
  ) { }

  public ngOnInit() {
    this.loaderService.loaderState.pipe(takeUntil(this.destroyed$)).subscribe((state: { show: boolean }) => {
      this.showLoader = state.show;
      this.cdref.detectChanges();
    });

    this.router.events.subscribe(a => {
      if (a instanceof NavigationStart) {
        return this.navigationEnd$ = of(false);
      }
      // if (a instanceof RouteConfigLoadEnd) {
      //     this.navigationEnd$ = of(true);
      // }
      if (a instanceof NavigationEnd) {
        return this.navigationEnd$ = of(true);
      }
    });
  }

  public ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  /**
   * ngOnChanges
   */
  public ngOnChanges(s: SimpleChanges) {
    //
  }
}
