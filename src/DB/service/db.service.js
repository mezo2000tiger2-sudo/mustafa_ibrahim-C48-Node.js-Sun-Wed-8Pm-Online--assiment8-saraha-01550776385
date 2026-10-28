export const create = async ({ model, data, options = {} } = {}) => {
    return await model.create([data], options)
}

export const findOne = async ({ model, filter, options = {} } = {}) => {
    return await model.findOne(filter, options)
}

export const find = async ({ model, filter = {}, options = {} } = {}) => {
    const { limit, skip, sort, populate, lean, select } = options
    const query = model.find(filter)

    if (limit) query.limit(limit)
    if (skip) query.skip(skip)
    if (sort) query.sort(sort)
    if (populate) query.populate(populate)
    if (select) query.select(select)
    if (lean) query.lean()

    return query.exec()
}
export const countDocuments = async ({ model, filter = {} } = {}) => {
    return await model.countDocuments(filter)
}

export const findOneAndUpdate = async ({ model,update, filter, options = {} } = {}) => {
    return await model.findOneAndUpdate(filter,update, options)
}

export const findById = async ({ model, id, options = {} } = {}) => {
    return await model.findById(id, options)
}

export const findByIdAndUpdate = async ({ model, id, update, options = {} } = {}) => {
    return await model.findByIdAndUpdate(id, update, { new: true, runValidators: true, ...options })
}
