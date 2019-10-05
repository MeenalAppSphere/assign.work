import { Document, Model, Types, Aggregate, SaveOptions, ClientSession } from 'mongoose';
import { BaseRequestModel, MongoosePaginateQuery } from '@aavantan-app/models';

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

  public async create(doc: T, session: ClientSession): Promise<T> {
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

  public async getAllPaginatedData(query: any, options: Partial<MongoosePaginateQuery> | any) {
    return (this.model as any).paginate(query, options);
  }

  public async delete(id: string): Promise<T> {
    return this.model
      .findByIdAndDelete(this.toObjectId(id))
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

  private toObjectId(id: string | number): Types.ObjectId {
    return Types.ObjectId(id);
  }

}
