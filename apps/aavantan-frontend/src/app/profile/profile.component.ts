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
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

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
  public activeView: any = {
    title: 'Profile',
    view: 'profile'
  };
  public passwordForm: FormGroup;
  public updateRequestInProcess:boolean;

  constructor(private _userQuery: UserQuery, private _generalService : GeneralService,
              private _projectService: ProjectService,
              protected notification: NzNotificationService,
              private FB: FormBuilder) {
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

      this.skillListData = [];

      this.passwordForm = this.FB.group({
        current_password: new FormControl(null, [Validators.required]),
        new_password: new FormControl(null, [Validators.required]),
        confirm_password: new FormControl(null, [Validators.required]),
      }, {validator: this.checkPasswords });

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

  public activeTab(view: string, title: string) {
    this.activeView = {
      title: title,
      view: view
    };
  }


  /* change password tab */

  public checkPasswords(group: FormGroup) {
    const pass = group.get('new_password').value;
    const confirmPass = group.get('confirm_password').value;
    return pass === confirmPass ? null : { notSame: true }
  }

  public save() {

    try{
      this.updateRequestInProcess = true;
      // api call here
      console.log(this.passwordForm.getRawValue());


      this.updateRequestInProcess = true;
    }catch (e) {
      this.updateRequestInProcess = true;
    }

  }

  ngOnDestroy (){

  }

}
