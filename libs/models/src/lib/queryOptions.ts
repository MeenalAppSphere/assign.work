import { BaseRequestModel } from './baseRequest.model';

export class MongoosePaginateQuery extends BaseRequestModel {
  populate?: any;
  select?: any;
  lean?: boolean;
}

export class MongooseQueryModel {
  filter: any;
  populate?: any;
  select?: string;
  lean?: boolean;
  sort?: string;
  sortBy?: 'asc' | 'desc' = 'asc';
  limit?: number;
}
