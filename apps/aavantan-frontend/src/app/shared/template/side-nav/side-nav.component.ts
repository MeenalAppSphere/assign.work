import { Component, OnInit, OnDestroy } from '@angular/core';
import { ROUTES } from './side-nav-routes.config';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { TaskType } from '@aavantan-app/models';
import { UserQuery } from '../../../queries/user/user.query';
import { Router } from '@angular/router';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { NzNotificationService } from 'ng-zorro-antd';

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

    constructor( private themeService: ThemeConstantService,
        protected notification: NzNotificationService,
        private _userQuery: UserQuery,private router:Router) {
            this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
                if (res) {
                  this.taskTypeDataSource = res.settings.taskTypes;
                  console.log('Task Type', this.taskTypeDataSource)
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
     public ngOnDestroy(){
    }
}
