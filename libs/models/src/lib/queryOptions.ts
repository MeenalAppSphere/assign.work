import { BaseRequestModel } from './baseRequest.model';

export class MongoosePaginateQuery extends BaseRequestModel {
  populate: any;
  select: any;
  collation: any;
  lean: boolean;
  leanWithId: boolean;
  customLabels: any;
}
