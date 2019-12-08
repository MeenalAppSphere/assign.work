import { Injectable } from '@nestjs/common';

@Injectable()
export class GeneralService {

  get userId(): string {
    return this._userId;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _userId: string;
}
