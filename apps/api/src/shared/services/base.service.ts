import { ClientSession, Document, DocumentQuery, Model, Types } from 'mongoose';
import { BasePaginatedResponse, MongoosePaginateQuery, MongooseQueryModel } from '@aavantan-app/models';
import {
  DEFAULT_PAGINATED_ITEMS_COUNT,
  DEFAULT_QUERY_FILTER,
  MAX_TRANSACTION_RETRY_TIMEOUT
} from '../helpers/defaultValueConstant';

export class BaseService<T extends Document> {
  constructor(private model: Model<T>) {
  }

  get dbModel() {
    return this.model;
  }

  public async find(model: MongooseQueryModel): Promise<T[]> {
    const query = this.model.find({ ...model.filter, ...DEFAULT_QUERY_FILTER });
    this.queryBuilder(model, query);

    return query.exec();
  }

  public async findById(id: string, populate: Array<any> = [], isLean = false): Promise<T> {
    const query = this.model.findById(this.toObjectId(id)).where(DEFAULT_QUERY_FILTER);

    if (populate && populate.length) {
      query.populate(populate);
    }

    if (isLean) {
      query.lean();
    }

    return query.exec();
  }

  public async findOne(model: MongooseQueryModel): Promise<T> {
    const query = this.model.findOne({ ...model.filter, ...DEFAULT_QUERY_FILTER });
    this.queryBuilder(model, query);

    return query.exec();
  }

  public async create(doc: T | T[] | Partial<T> | Partial<T[]>, session: ClientSession): Promise<T | T[]> {
    return await this.model.create(doc, { session });
  }

  public async createMany(docs: any[], session: ClientSession): Promise<T[]> {
    return await this.model.insertMany(docs, { session });
  }

  public async updateById(id: string, updatedDoc: any, session: ClientSession): Promise<T> {
    return await this.model
      .updateOne({ _id: id }, updatedDoc, { session }).exec();
  }

  public async update(condition: any, updatedDoc: any, session: ClientSession): Promise<T> {
    return await this.model
      .updateOne(condition, updatedDoc, { session }).exec();
  }

  public async bulkUpdate(filter: any, updatedDoc: any, session: ClientSession) {
    return this.model
      .updateMany(filter, updatedDoc, { session });
  }

  public async getAllPaginatedData(filter: any = {}, options: Partial<MongoosePaginateQuery> | any): Promise<BasePaginatedResponse<any>> {
    options.count = options.count || DEFAULT_PAGINATED_ITEMS_COUNT;
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

    if (options.sort) {
      query.sort({ [options.sort]: options.sortBy || 'asc' });
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

  public async delete(id: string, session: ClientSession): Promise<T> {
    return this.model
      .update({ _id: this.toObjectId(id) }, { isDeleted: true }, { session })
      .exec();
  }

  public toObjectId(id: string | number): Types.ObjectId {
    return new Types.ObjectId(id);
  }

  public isValidObjectId(id: string) {
    return Types.ObjectId.isValid(id);
  }

  // create a session start a transaction and return it
  public async startSession(): Promise<ClientSession> {
    const session = await this.model.db.startSession();
    session.startTransaction();
    return session;
  }

  /**
   * commit session and end that session
   * @param session
   * @returns {Promise<void>}
   */
  public async commitTransaction(session: ClientSession) {
    await session.commitTransaction();
    session.endSession();
  }

  /**
   * abort a session and end that session
   * @param session
   * @returns {Promise<void>}
   */
  public async abortTransaction(session: ClientSession) {
    await session.abortTransaction();
    session.endSession();
  }

  /**
   * retry failed session implementation
   * accepts a function which get's called inside a while loop
   * if an error occurs regarding transaction error then it will try to rerun the session
   * and if there any errors which are not type of transaction error then it will throw and log error
   * @param txnFn
   */
  async withRetrySession(txnFn: Function) {
    const startTime = Date.now();
    while (true) {
      // create a session
      const session = await this.startSession();
      try {
        // execute requested function
        const result = await txnFn(session);

        // if all seems good commit transaction
        await this.commitTransaction(session);
        return result;
      } catch (e) {
        // if error type is TransientTransactionError then try to re commit the session
        const isTransientError = e.errorLabels && e.errorLabels.includes('TransientTransactionError') && this.hasNotTimedOut(startTime, MAX_TRANSACTION_RETRY_TIMEOUT);
        const isCommitError = e.errorLabels && e.errorLabels.includes('UnknownTransactionCommitResult') && this.hasNotTimedOut(startTime, MAX_TRANSACTION_RETRY_TIMEOUT);

        if (!isTransientError || !isCommitError) {
          // if not transaction error then throw it away
          await this.handleError(session, e);
        }
      }
    }
  }

  /**
   * check whether max transaction timed out or not
   * @param startTime
   * @param max
   */
  private hasNotTimedOut(startTime, max) {
    return Date.now() - startTime < max;
  }

  protected async handleError(session, err) {
    await this.abortTransaction(session);
    throw err;
  }

  private queryBuilder(model: MongooseQueryModel, query: DocumentQuery<any, any>) {
    if (model.populate && model.populate.length) {
      query.populate(model.populate);
    }

    if (model.select) {
      query.select(model.select);
    }

    if (model.lean) {
      query.lean();
    }

    if (model.sort) {
      query.sort({ [model.sort]: model.sortBy || 'asc' });
    }
  }

}
