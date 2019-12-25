import { ClientSession, Document, Model, Types } from 'mongoose';
import { BasePaginatedResponse, MongoosePaginateQuery, MongooseQueryModel } from '@aavantan-app/models';
import { DEFAULT_QUERY_FILTER } from '../helpers/defaultValueConstant';

export class BaseService<T extends Document> {
  constructor(private model: Model<T>) {
  }

  public async find(model: MongooseQueryModel): Promise<T[]> {
    const query = this.model.find({ ...model.filter, ...DEFAULT_QUERY_FILTER });

    if (model.populate && model.populate.length) {
      query.populate(model.populate);
    }

    if (model.select) {
      query.select(model.select);
    }

    if (model.lean) {
      query.lean();
    }

    return query.exec();
  }

  public async findById(id: string, queryModel: MongooseQueryModel): Promise<T> {
    const query = this.model.findById(this.toObjectId(id)).where(DEFAULT_QUERY_FILTER);

    if (queryModel.populate && queryModel.populate.length) {
      query.populate(queryModel.populate);
    }

    if (queryModel.select) {
      query.select(queryModel.select);
    }

    if (queryModel.lean) {
      query.lean();
    }

    return query.exec();
  }

  public async findOne(model: MongooseQueryModel): Promise<T> {
    const query = this.model.findOne({ ...model.filter, ...DEFAULT_QUERY_FILTER });

    if (model.populate && model.populate.length) {
      query.populate(model.populate);
    }

    if (model.select) {
      query.select(model.select);
    }

    if (model.lean) {
      query.lean();
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
    options.count = options.count || 20;
    options.page = options.page || 1;

    const query = this.model
      .find({ ...filter, ...DEFAULT_QUERY_FILTER })
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
    const numberOfDocs = await this.model.countDocuments({ ...filter, ...DEFAULT_QUERY_FILTER });

    return {
      page: options.page,
      totalItems: numberOfDocs,
      totalPages: Math.ceil(numberOfDocs / options.count),
      count: options.count,
      items: result
    };
  }

  public async getAll(filter: any = {}, populate: Array<any> = []) {
    const query = this.model.find({ ...filter, ...DEFAULT_QUERY_FILTER });
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

  public toObjectId(id: string | number): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  public isValidObjectId(id: string) {
    return Types.ObjectId.isValid(id);
  }

}
