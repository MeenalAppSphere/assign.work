import { Organization, Project, User } from '@aavantan-app/models';
import { Injectable } from '@angular/core';

@Injectable()
export class GeneralService {
  get currentOrganization(): Organization {
    return this._currentOrganization;
  }

  set currentOrganization(value: Organization) {
    this._currentOrganization = value;
  }

  get currentProject(): Project {
    return this._currentProject;
  }

  set currentProject(value: Project) {
    this._currentProject = value;
  }

  get userLocale(): string {
    return this._userLocale;
  }

  set userLocale(value: string) {
    this._userLocale = value;
  }

  get token(): string {
    return this._token;
  }

  set token(value: string) {
    this._token = value;
  }

  get user(): User {
    return this._user;
  }

  set user(value: User) {
    this._user = value;
  }

  private _user: User;
  private _token: string;
  private _userLocale: string;
  private _currentProject: Project;
  private _currentOrganization: Organization;
}
