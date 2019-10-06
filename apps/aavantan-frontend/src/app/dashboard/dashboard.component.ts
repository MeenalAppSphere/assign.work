import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IBreadcrumb } from '../shared/interfaces/breadcrumb.type';
import { Observable, of } from 'rxjs';
import { ThemeConstantService } from '../shared/services/theme-constant.service';
import { delay, distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { JoyrideService } from 'ngx-joyride';

@Component({
  templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit {
  breadcrumbs$: Observable<IBreadcrumb[]>;
  contentHeaderDisplay: String ='none';
  isFolded : boolean ;
  isSideNavDark : boolean;
  isExpand: boolean;
  selectedHeaderColor: string;

  constructor(private router: Router,  private activatedRoute: ActivatedRoute, private themeService: ThemeConstantService,
  private joyrideService: JoyrideService) {
    // Disable breadcrumbs
    // this.router.events.pipe(
    //   filter(event => event instanceof NavigationEnd),
    //   map(() => {
    //     let child = this.activatedRoute.firstChild;
    //     while (child) {
    //       if (child.firstChild) {
    //         child = child.firstChild;
    //       } else if (child.snapshot.data && child.snapshot.data['headerDisplay']) {
    //         return child.snapshot.data['headerDisplay'];
    //       } else {
    //         return null;
    //       }
    //     }
    //     return null;
    //   })
    // ).subscribe( (data: any) => {
    //   this.contentHeaderDisplay = data;
    // });
  }

  ngOnInit() {
    // Disable breadcrumbs
    // this.breadcrumbs$ = this.router.events.pipe(
    //   startWith(new NavigationEnd(0, '/', '/')),
    //   filter(event => event instanceof NavigationEnd),distinctUntilChanged(),
    //   map(data => this.buildBreadCrumb(this.activatedRoute.root))
    // );
    this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
    this.themeService.isSideNavDarkChanges.subscribe(isDark => this.isSideNavDark = isDark);
    this.themeService.selectedHeaderColor.subscribe(color => this.selectedHeaderColor = color);
    this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);

    setTimeout(()=>{
      // this.startTour();
    },1000);


  }

  private buildBreadCrumb(route: ActivatedRoute, url: string = '', breadcrumbs: IBreadcrumb[] = []): IBreadcrumb[] {
    let label = '', path = '/', display = null;

    if (route.routeConfig) {
      if (route.routeConfig.data) {
        label = route.routeConfig.data['title'];
        path += route.routeConfig.path;
      }
    } else {
      label = 'Dashboard';
      path += 'dashboard';
    }

    const nextUrl = path && path !== '/dashboard' ? `${url}${path}` : url;
    const breadcrumb = <IBreadcrumb>{
      label: label, url: nextUrl
    };

    const newBreadcrumbs = label ? [...breadcrumbs, breadcrumb] : [...breadcrumbs];
    if (route.firstChild) {
      return this.buildBreadCrumb(route.firstChild, nextUrl, newBreadcrumbs);
    }
    return newBreadcrumbs;
  }

  stepDone() {
    setTimeout(() => {
      console.log('Step done!');
    }, 3000);
  }

  startTour() {
    const options = {
      steps: ['tour1', 'tour2','main-menu', 'tour-card0@dashboard/home', 'tour3',"board@dashboard/board"],
      startWith: 'tour1',
      // waitingTime: 2000,
      stepDefaultPosition: 'top',
      themeColor: '#000000',
      showPrevButton: true,
      logsEnabled: true,
      customTexts: { prev: of('<<').pipe(delay(2000)), next: '>>' }
    };
    this.joyrideService.startTour(options).subscribe(
      step => {
        console.log('Next:', step);
      },
      e => {
        console.log('Error', e);
      },
      () => {
        this.stepDone();
        console.log('Tour finished');
      }
    );
  }



}
