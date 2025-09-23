import { Model, MongooseUpdateQueryOptions, ProjectionType, RootFilterQuery, UpdateQuery } from "mongoose";

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
        options?: MongooseUpdateQueryOptions<T>
    ) {
        return await this.model.findOne(filter, projection, options);
    }

    async delete(filter: RootFilterQuery<T>){
        return await this.model.deleteOne(filter);
    }
};
