import { Document, Model, Types, Aggregate } from 'mongoose';
import { BaseRequestModel } from '@aavantan-app/models';

const myPaginationLabels = {
  docs: 'items',
  limit: 'count',
  page: 'page',
  totalDocs: 'totalItems',
  totalPages: 'totalPages'
};

export class BaseService<T extends Document> {
  constructor(protected model: Model<T>) {
  }

  public async find(filter: any = {}): Promise<T[]> {
    return this.model.find(filter).exec();
  }

  public async findById(id: string): Promise<T> {
    return this.model.findById(this.toObjectId(id)).exec();
  }

  public async findOne(filter: any = {}): Promise<T> {
    return this.model.findOne(filter).exec();
  }

  public async create(doc: T): Promise<T> {
    return this.model.create(doc);
  }

  public async update(
    id: string,
    updatedDoc: T
  ): Promise<T> {
    return await this.model
      .findByIdAndUpdate(this.toObjectId(id), updatedDoc)
      .exec();
  }

  public async getAllPaginatedData(query: any, paginationOption: Partial<BaseRequestModel>) {
    return (this.model as any).aggregatePaginate(query, this.transformPaginationObject(paginationOption));
  }

  public async delete(id: string): Promise<T> {
    return this.model
      .findByIdAndDelete(this.toObjectId(id))
      .exec();
  }

  private transformPaginationObject(object: Partial<BaseRequestModel>) {
    return {
      page: object.page,
      limit: object.count,
      sort: { [object.sortBy]: object.sort },
      allowDiskUse: true,
      customLabels: myPaginationLabels
    };
  }

  private toObjectId(id: string | number): Types.ObjectId {
    return Types.ObjectId(id);
  }

}
