import {
  Model,
  MongooseUpdateQueryOptions,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
  UpdateQuery,
} from "mongoose";

export class AbstractRepository<T> {
  constructor(protected model: Model<T>) {}

  async exists(filter: RootFilterQuery<T>): Promise<boolean> {
      return !!await this.model.exists(filter);
  }

  async create(item: Partial<T>) {
    const newItem = new this.model(item);
    return await newItem.save();
  }

  async createMany(items: Partial<T>[]) {
    return await this.model.insertMany(items);
  }

  async update(
    filter: RootFilterQuery<T>,
    update: UpdateQuery<T>,
    options?: MongooseUpdateQueryOptions<T>
  ) {
    return await this.model.updateOne(filter, update, options);
  }

  async findByIdAndUpdate(
    filter: RootFilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions<T>
  ) {
    return await this.model.findByIdAndUpdate(filter, update, options);
  }

  async updateMany(
    filter: RootFilterQuery<T>,
    update: UpdateQuery<T>,
    options?: MongooseUpdateQueryOptions<T>
  ) {
    return await this.model.updateMany(filter, update, options);
  }

  async findAndUpdate(
    filter: RootFilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions<T>
  ) {
    return await this.model.findOneAndUpdate(filter, update, options);
  }

  async findById(
    id: string | any,
    projection?: ProjectionType<T>,
    options?: QueryOptions
  ) {
    return await this.model.findById(id, projection, options);
  }

  async findOne(
    filter: RootFilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions
  ) {
    return await this.model.findOne(filter, projection, options);
  }

  async find(
    filter: RootFilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions
  ) {
    return await this.model.find(filter, projection, options);
  }

  async delete(filter: RootFilterQuery<T>) {
    return await this.model.deleteOne(filter);
  }

  async findAndDelete(filter: RootFilterQuery<T>, options?: QueryOptions) {
    return await this.model.findOneAndDelete(filter, options);
  }

  async deleteMany(filter: RootFilterQuery<T>) {
    return await this.model.deleteMany(filter);
  }
}
