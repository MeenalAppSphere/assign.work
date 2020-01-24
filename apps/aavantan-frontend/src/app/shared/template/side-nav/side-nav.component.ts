import { Component, OnInit, OnDestroy } from '@angular/core';
import { ROUTES } from './side-nav-routes.config';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { Organization, TaskType } from '@aavantan-app/models';
import { UserQuery } from '../../../queries/user/user.query';
import { Router } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { NzNotificationService } from 'ng-zorro-antd';
import { GeneralService } from '../../services/general.service';
import { OrganizationQuery } from '../../../queries/organization/organization.query';
import { OrganizationService } from '../../services/organization/organization.service';

@Component({
    selector: 'app-sidenav',
    templateUrl: './side-nav.component.html',
    styleUrls:['./side-nav.component.scss']
})

export class SideNavComponent implements OnInit, OnDestroy{

    public menuItems: any[]
    public adminMenuItems: any[]
    isFolded : boolean;
    isSideNavDark : boolean;
    public taskTypeDataSource: TaskType[] = [];
    public currentOrganization: Organization;
    public organizations:string[] | Organization[]=[];
    public switchOrganizationInProcess:boolean;

    constructor(private themeService: ThemeConstantService,
                 protected notification: NzNotificationService,
                 private _userQuery: UserQuery,
                 private _organizationService: OrganizationService,
                 private _generalService: GeneralService,
                 private router:Router) {



        this.organizations = this._generalService.user.organizations;

        this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
            if (res) {
              this.taskTypeDataSource = res.settings.taskTypes;
              // console.log('Task Type', this.taskTypeDataSource)
            }
          });

        this._userQuery.currentOrganization$.pipe(untilDestroyed(this)).subscribe(res => {
          if (res) {
            this.currentOrganization = res;
          }
        });

    }

    ngOnInit(): void {
        this.menuItems = ROUTES.filter(menuItem => menuItem.type!=='admin');
        this.adminMenuItems = ROUTES.filter(menuItem => menuItem.type==='admin');
        this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
        this.themeService.isSideNavDarkChanges.subscribe(isDark => this.isSideNavDark = isDark);
    }

     public createNewTask(item?:TaskType){
        let displayName: string= 'TASK';
        if(this.taskTypeDataSource[0] && this.taskTypeDataSource[0].displayName){
            displayName=this.taskTypeDataSource[0].displayName;
        }

        if(!displayName){
        this.notification.error('Info', 'Please create task types from settings');
        setTimeout(()=>{
            this.router.navigateByUrl("dashboard/settings");
        },1000);
        return
        }
        this.router.navigateByUrl("dashboard/task/"+displayName);
     }

    public switchOrganization(organizationId:string){
      try{

        if(this._generalService.currentOrganization.id===organizationId){
          return;
        }

        this.switchOrganizationInProcess = true;

        this._organizationService.switchOrganization(organizationId).subscribe((res => {
            this.switchOrganizationInProcess = false;
          }), (error => {
            this.switchOrganizationInProcess = false;
          }));

      } catch (e) {
        this.switchOrganizationInProcess = false;
      }       
    }
     
     
     public ngOnDestroy(){
    }
}
