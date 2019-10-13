import { Document, Model, Types, Aggregate, SaveOptions, ClientSession, Query, QueryPopulateOptions } from 'mongoose';
import { BaseRequestModel, MongoosePaginateQuery } from '@aavantan-app/models';

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

export class BaseService<T extends Document> {
  constructor(private model: Model<T>) {
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

  public async update(
    id: string,
    updatedDoc: T
  ): Promise<T> {
    const session = await this.model.db.startSession();
    session.startTransaction();

    let result;
    try {
      result = await this.model
        .findByIdAndUpdate(this.toObjectId(id), updatedDoc)
        .exec();
      await session.commitTransaction();
      session.endSession();
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
    return result;
  }

  public async getAllPaginatedData(query: any = {}, options: Partial<MongoosePaginateQuery> | any) {
    return (this.model as any).paginate(query, options);
  }

  public async getAll() {
    return await this.find();
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
