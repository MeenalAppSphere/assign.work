import { Project, ProjectStages, Sprint } from '@aavantan-app/models';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../../queries/user/user.query';


@Component({
  templateUrl: './no-access.component.html'
})

export class NoAccessComponent implements OnInit, OnDestroy{

  
  public currentProject: Project = null;
  
  constructor(private _userQuery:UserQuery){}
  

  ngOnInit()
  {
      this._userQuery.currentProject$.pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.currentProject = res;
        }
 });
}

ngOnDestroy()
{}
}

