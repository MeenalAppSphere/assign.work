import { Component, OnDestroy, OnInit } from '@angular/core';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { UserQuery } from '../queries/user/user.query';
import { ChangePasswordModel, GetAllProjectsModel, Project, User, UserLoginProviderEnum } from '@aavantan-app/models';
import { ProjectService } from '../shared/services/project/project.service';
import { GeneralService } from '../shared/services/general.service';
import { NzNotificationService } from 'ng-zorro-antd';
import { UserUrls } from '../shared/services/user/user.url';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../shared/services/user/user.service';

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
  public passwordForm: FormGroup;
  public updateRequestInProcess:boolean;
  public isShowChangePassword:boolean;

  constructor(private _userQuery: UserQuery, private _generalService : GeneralService,
              private _projectService: ProjectService,
              private _userService: UserService,
              protected notification: NzNotificationService,
              private FB: FormBuilder) {
  }


    ngOnInit(): void {

      this.isShowChangePassword = this._generalService.user.lastLoginProvider===UserLoginProviderEnum.normal;

      this.attachementUrl = UserUrls.uploadProfilePic;
      this.attachementHeader = {
        Authorization: 'Bearer ' + this._generalService.token
      };

      const json:GetAllProjectsModel= {
        organizationId : this._generalService.currentOrganization.id
      }


      this._userQuery.user$.pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.currentUser = res;
          this.initialName = this.currentUser.firstName.substr(0,2).toUpperCase();
        }
      });

      this.skillListData = [];

      this.passwordForm = this.FB.group({
        currentPassword: new FormControl(null, [Validators.required]),
        newPassword: new FormControl(null, [Validators.required]),
        confirmPassword: new FormControl(null, [Validators.required]),
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


  /* change password tab */

  public checkPasswords(group: FormGroup) {
    const pass = group.get('newPassword').value;
    const confirmPass = group.get('confirmPassword').value;
    if(pass && confirmPass) {
      return pass === confirmPass ? null : { notSame: true }
    }

  }

  async save() {

    try{

      const json: ChangePasswordModel = this.passwordForm.getRawValue();
      json.emailId = this._generalService.user.emailId;

      this.updateRequestInProcess = true;
      await this._userService.changePassword(json).subscribe((res => {
        this.updateRequestInProcess = false;
      }), (error => {
        this.updateRequestInProcess = false;
      }));

      this.updateRequestInProcess = true;

    }catch (e) {
      this.updateRequestInProcess = true;
    }

  }

  ngOnDestroy (){

  }

}
