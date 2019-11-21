import { Component, OnDestroy, OnInit } from '@angular/core';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../queries/user/user.query';
import { Project, User } from '@aavantan-app/models';
import { ProjectService } from '../shared/services/project/project.service';

@Component({
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})

export class ProfileComponent implements OnInit, OnDestroy {
  public currentUser: User;
  public projectMembers: User[] = [];
  public projectListData:Project[] = [];
  public initialName: string = 'AW';

  constructor(private _userQuery: UserQuery, private _projectService: ProjectService) {
  }

    skillListData = ['JS', 'Angular', 'HTML', 'CSS', 'Web Design', 'Mobile App Design', 'User Interface'];

    ngOnInit(): void {

      this._projectService.getAllProject().subscribe((data)=>{
        this.projectListData = data.data;
      });

      this._userQuery.user$.pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.currentUser = res;
          this.initialName = this.currentUser.firstName.substr(0,2).toUpperCase();
        }
      });

    }

  ngOnDestroy (){

  }

}
