import { BaseRequestModel } from './baseRequest.model';

export class MongoosePaginateQuery extends BaseRequestModel {
  populate?: any;
  select?: any;
  lean?: boolean;
}
