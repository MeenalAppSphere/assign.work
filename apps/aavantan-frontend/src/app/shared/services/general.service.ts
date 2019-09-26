import { User } from '@aavantan-app/models';

export class GeneralService {
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
}
