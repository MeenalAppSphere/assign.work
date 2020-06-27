import { Injectable } from '@nestjs/common';
import * as randomcolor from 'randomcolor';

@Injectable()
export class GeneralService {
  get locale(): string {
    return this._locale;
  }

  set locale(value: string) {
    this._locale = value;
  }

  get userId(): string {
    return this._userId;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _userId: string;
  private _locale: string;

  /**
   * generates a random color
   */
  generateRandomColor() {
    return randomcolor({ luminosity: 'bright' });
  }
}
