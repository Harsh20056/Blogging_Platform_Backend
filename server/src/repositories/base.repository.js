import { AppError } from '../utils/AppError.js'

export class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findById(id) {
         const record = await this.model.findByPk(id);
         if (!record) throw new AppError(`${this.model.name} not found`, 404)
         return record;
     }

    async findAll(filter = {}, options = {}) {
        return await this.model.findAll({ where: filter, ...options })
    }

    async create(data, options = {}) {
        return await this.model.create(data, options)
    }

    async update(id, data) {
        const record = await this.findById(id);
        return await record.update(data)
    }

    async delete(id){
        const record = await this.findById(id);
        return await record.destroy();
    }
}