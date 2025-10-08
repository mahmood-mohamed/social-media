import { Model, MongooseUpdateQueryOptions, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery } from "mongoose";

export class AbstractRepository<T> {

    constructor(protected model: Model <T>) {}

    async create(item: Partial<T>){
        const newItem = new this.model(item);
        return await newItem.save();
    };

    async update(
        filter: RootFilterQuery<T>, 
        update: UpdateQuery<T>, 
        options?: MongooseUpdateQueryOptions<T>
    ){
        return await this.model.updateOne(filter, update, options);
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

    async delete(filter: RootFilterQuery<T>){
        return await this.model.deleteOne(filter);
    }

    async deleteMany(filter: RootFilterQuery<T>){
        return await this.model.deleteMany(filter);
    }
};
