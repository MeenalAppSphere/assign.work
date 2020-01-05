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
  public projectMembers: User[] = [];
  public projectListData:Project[] = [];
  public initialName: string = 'AW';


  public attachementUrl: string;
  public attachementHeader: any;
  public fileList = [
    {
      uid: -1,
      name: 'xxx.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
    }
  ];
  public previewImage = '';
  public previewVisible = false;
  public attachementIds: string[] = [];
  public uploadedImages = [];
  public skillListData:string[] = [];

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
    if (status !== 'uploading') {
      console.log(file, fileList);
    }
    if (status === 'done') {

      if (file.response && file.response.data.id) {
        this.attachementIds.push(file.response.data.id);
      }

      this.notification.success('Success', `${file.name} file uploaded successfully.`);
    } else if (status === 'error') {
      this.notification.error('Error', `${file.name} file upload failed.`);
    }
  }

  handlePreview = (file: UploadFile) => {
    this.previewImage = file.url || file.thumbUrl;
    this.previewVisible = true;
  }

  handleRemove = (file: any) => new Observable<boolean>((obs) => {
    // console.log(file);

    //this._taskService.removeAttachment(file.id).subscribe();

    this.attachementIds.splice(this.attachementIds.indexOf(file.id), 1);
    this.uploadedImages = this.uploadedImages.filter((ele) => {
      if (ele.id !== file.id) {
        return ele;
      }
    });


    // console.log('this.handleRemove instanceof Observable', this.handleRemove instanceof Observable)
    // console.log(obs)
    obs.next(false);
  });

  ngOnDestroy (){

  }

}
