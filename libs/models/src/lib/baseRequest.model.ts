import { DEFAULT_PAGINATED_ITEMS_COUNT } from '../../../../apps/api/src/shared/helpers/defaultValueConstant';

export class BaseRequestModel {
  public sort?: string;
  public sortBy?: string;
  public query?: string;
  public from?: string;
  public to?: string;
  public page?: number;
  public count?: number;
  public totalPages?: number;
  public totalItems?: number;

  constructor() {
    this.page = 1;
    this.count = DEFAULT_PAGINATED_ITEMS_COUNT;
    this.sortBy = 'asc';
    this.query = '';
  }

}
