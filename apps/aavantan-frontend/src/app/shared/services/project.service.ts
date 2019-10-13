import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { ProjectState, ProjectStore } from '../../store/project/project.store';
import { HttpWrapperService } from './httpWrapper.service';
import { GeneralService } from './general.service';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd';

@Injectable()
export class ProjectService extends BaseService<ProjectStore, ProjectState> {
  constructor(protected projectStore: ProjectStore, private _http: HttpWrapperService, private _generalService: GeneralService, private router: Router,
              private notification: NzNotificationService) {
    super(projectStore);
  }

  getDetails(id: string) {

  }
}
