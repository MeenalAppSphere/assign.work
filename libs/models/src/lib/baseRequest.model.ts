export class BaseRequestModel {
  public sort: string;
  public sortBy: 'asc' | 'desc' = 'asc';
  public q?: string;
  public from?: string;
  public to?: string;
  public page? = 1;
  public count? = 10;
}
