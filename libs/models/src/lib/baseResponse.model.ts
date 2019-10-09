export class BaseResponseModel<T> {
  public status: number;
  public hasError: boolean;
  public data: T;
  public errors: BaseErrorMessageClass[];

  get error() {
    if (this.hasError) {
      return this.errors[0];
    }
  }
}

export class BasePaginatedResponse<P> {
  public items: P[];
  public totalItems: number;
  public totalPages: number;
  public count: number;
  public page: number;
}

export class BaseErrorMessageClass {
  public message: string;
  public type: string;
}

export class ResponseParser<T> {
  constructor(data: T, status: number, message: string) {
    if (status === 0) {

    } else {

    }
  }
}
