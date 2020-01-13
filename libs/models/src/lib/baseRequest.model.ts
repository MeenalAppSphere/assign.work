export class BaseRequestModel {
  public sort?: string;
  public sortBy?: 'asc' | 'desc' = 'asc';
  public query?: string;
  public from?: string;
  public to?: string;
  public page?: number = 1;
  public count?: number = 10;

  constructor() {
    this.page = 1;
    this.count = 10;
    this.sortBy = 'asc';
  }

}
