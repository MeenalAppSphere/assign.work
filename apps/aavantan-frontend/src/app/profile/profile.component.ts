import { Component, OnDestroy, OnInit } from '@angular/core';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../queries/user/user.query';
import { GetAllProjectsModel, Project, User } from '@aavantan-app/models';
import { ProjectService } from '../shared/services/project/project.service';
import { GeneralService } from '../shared/services/general.service';
import { Observable } from 'rxjs';
import { NzNotificationService, UploadFile } from 'ng-zorro-antd';
import { TaskUrls } from '../shared/services/task/task.url';
import { UserUrls } from '../shared/services/user/user.url';

@Component({
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})

export class ProfileComponent implements OnInit, OnDestroy {
  public currentUser: User;
  public projectListData:Project[] = [];
  public initialName: string = 'AW';
  public attachementUrl: string;
  public attachementHeader: any;
  public previewImage = '';
  public uploadedImages = [];
  public skillListData:string[] = [];
  public uploadingImage:boolean = false;

  constructor(private _userQuery: UserQuery, private _generalService : GeneralService,
              private _projectService: ProjectService,
              protected notification: NzNotificationService) {
  }


    ngOnInit(): void {

      this.attachementUrl = UserUrls.uploadProfilePic;
      this.attachementHeader = {
        Authorization: 'Bearer ' + this._generalService.token
      };

      const json:GetAllProjectsModel= {
        organizationId : this._generalService.currentOrganization.id
      }
      this._projectService.getAllProject(json).subscribe((data)=>{
        this.projectListData = data.data;
      });

      this._userQuery.user$.pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.currentUser = res;
          this.initialName = this.currentUser.firstName.substr(0,2).toUpperCase();
        }
      });

      this.skillListData = ['JS', 'Angular', 'HTML', 'CSS', 'Web Design', 'Mobile App Design', 'User Interface'];

    }

  handleChange({ file, fileList }): void {
    const status = file.status;
    this.uploadingImage=true;
    if (status !== 'uploading') {
      console.log(file, fileList);
    }
    if (status === 'done') {

      if (file.response && file.response.data.id) {
        this.previewImage = file.response.data.url || file.response.data.thumbUrl;
        this.uploadingImage = false;
      }

      this.notification.success('Success', `${file.name} file uploaded successfully.`);
    } else if (status === 'error') {
      this.notification.error('Error', `${file.name} file upload failed.`);
    }
  }


  ngOnDestroy (){

  }

}
