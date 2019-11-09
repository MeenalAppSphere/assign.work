import { ClientSession, Document, Model, Types } from 'mongoose';
import { BasePaginatedResponse, MongoosePaginateQuery } from '@aavantan-app/models';

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

  public async findById(id: string, populate: Array<any> = [], isLean = false): Promise<T> {
    const query = this.model.findById(this.toObjectId(id)).where(defaultQueryOptions);

    if (populate && populate.length) {
      query.populate(populate);
    }

    if (isLean) {
      query.lean();
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

  public async getAllPaginatedData(filter: any = {}, options: Partial<MongoosePaginateQuery> | any): Promise<BasePaginatedResponse<any>> {
    options.count = options.count || 10;
    options.page = options.page || 1;

    const query = this.model
      .find({ ...filter, ...defaultQueryOptions })
      .skip((options.count * options.page) - options.count)
      .limit(options.count);

    if (options.populate && options.populate.length) {
      query.populate(options.populate);
    }

    if (options.select) {
      query.select(options.select);
    }

    const result = await query.lean().exec();
    result.forEach((doc) => {
      doc.id = String(doc._id);
    });
    const numberOfDocs = await this.model.countDocuments({ ...filter, ...defaultQueryOptions });

    return {
      page: options.page,
      totalItems: numberOfDocs,
      totalPages: Math.ceil(numberOfDocs / options.count),
      count: options.count,
      items: result
    };
  }

  public async getAll(filter: any = {}, populate: Array<any> = []) {
    const query = this.model.find({ ...filter, ...defaultQueryOptions });
    if (populate && populate.length) {
      query.populate(populate);
    }
    return query.lean().exec();
  }

  public async count(filter: any = {}): Promise<number> {
    return this.model.count(filter);
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
