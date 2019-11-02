import { ClientSession, Document, Model, Types } from 'mongoose';
import { MongoosePaginateQuery } from '@aavantan-app/models';
import { S3Client } from './S3Client.service';
import * as aws from 'aws-sdk';

const myPaginationLabels = {
  docs: 'items',
  limit: 'count',
  page: 'page',
  totalDocs: 'totalItems',
  totalPages: 'totalPages'
};

const defaultQueryOptions = {
  isDeleted: false
};

export class BaseService<T extends Document> extends S3Client {
  constructor(private model: Model<T>) {
    super(new aws.S3({ region: 'us-east-1' }), 'images.assign.work', '');
  }

  public async find(filter: any = {}, populate: Array<any> = []): Promise<T[]> {
    const query = this.model.find({ ...filter, ...defaultQueryOptions });
    if (populate && populate.length) {
      query.populate(populate);
    }
    return query.exec();
  }

  public async findById(id: string, populate: Array<any> = []): Promise<T> {
    const query = this.model.findById(this.toObjectId(id)).where(defaultQueryOptions);
    if (populate && populate.length) {
      query.populate(populate);
    }
    return query.exec();
  }

  public async findOne(filter: any = {}, populate: Array<any> = []): Promise<T> {
    const query = this.model.findOne({ ...filter, ...defaultQueryOptions });
    if (populate && populate.length) {
      query.populate(populate);
    }
    return query.exec();
  }

  public async create(doc: T | T[] | Partial<T> | Partial<T[]>, session: ClientSession): Promise<T | T[]> {
    return await this.model.create(doc, { session });
  }

  public async update(id: string, updatedDoc: T | Partial<T>, session: ClientSession): Promise<T> {
    return await this.model
      .updateOne({ _id: id }, updatedDoc, { session }).exec();
  }

  public async getAllPaginatedData(query: any = {}, options: Partial<MongoosePaginateQuery> | any) {
    return (this.model as any).paginate(query, options);
  }

  public async getAll(filter: any = {}, populate: Array<any> = []) {
    const query = this.model.find({ ...filter, ...defaultQueryOptions });
    if (populate && populate.length) {
      query.populate(populate);
    }
    return query.exec();
  }

  public async delete(id: string): Promise<T> {
    return this.model
      .update({ id: this.toObjectId(id) }, { isDeleted: true })
      .exec();
  }

  private transformPaginationObject(object: Partial<MongoosePaginateQuery>) {
    return {
      page: object.page,
      limit: object.count,
      sort: { [object.sortBy]: object.sort },
      allowDiskUse: true,
      customLabels: myPaginationLabels,
      lean: true,
      leanWithId: true,
      populate: object.populate
    };
  }

  public toObjectId(id: string | number): Types.ObjectId {
    return new Types.ObjectId(id);
  }

}
