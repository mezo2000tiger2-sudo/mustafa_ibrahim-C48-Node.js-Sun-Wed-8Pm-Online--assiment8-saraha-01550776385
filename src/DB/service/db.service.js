import mongoose from 'mongoose';

export const create = async ({ model, data, options = {} } = {}) => {
    return await model.create([data], options)
}

export const findOne = async ({ model, filter, options = {}, select, populate, session } = {}) => {
    const query = model.findOne(filter, options)
    if (select) query.select(select)
    if (populate) query.populate(populate)
    if (session) query.session(session)
    return await query.exec()
}

export const find = async ({ model, filter = {}, options = {} } = {}) => {
    const { limit, skip, sort, populate, lean, select, session } = options
    const query = model.find(filter)

    if (limit) query.limit(limit)
    if (skip) query.skip(skip)
    if (sort) query.sort(sort)
    if (populate) query.populate(populate)
    if (select) query.select(select)
    if (lean) query.lean()
    if (session) query.session(session)

    return query.exec()
}
export const countDocuments = async ({ model, filter = {}, options = {} } = {}) => {
    return await model.countDocuments(filter, options)
}

export const findOneAndUpdate = async ({ model,update, filter, options = {} } = {}) => {
    return await model.findOneAndUpdate(filter,update, options)
}

export const findById = async ({ model, id, options = {}, select, populate, session } = {}) => {
    const query = model.findById(id, options)
    if (select) query.select(select)
    if (populate) query.populate(populate)
    if (session) query.session(session)
    return await query.exec()
}

export const updateOne = async ({ model, filter, update, options = {} } = {}) => {
    return await model.updateOne(filter, update, options)
}

export const aggregate = async ({ model, pipeline, options = {} } = {}) => {
    return await model.aggregate(pipeline, options)
}

export const transaction = async (callback) => {
    const session = await mongoose.startSession()
    try {
        return await session.withTransaction(() => callback(session))
    } finally {
        await session.endSession()
    }
}

export const findByIdAndUpdate = async ({ model, id, update, options = {} } = {}) => {
    return await model.findByIdAndUpdate(id, update, { new: true, runValidators: true, ...options })
}
