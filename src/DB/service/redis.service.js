import { redis_client } from "../connection.redis.js"

const encode = (value) => JSON.stringify(value)
const decode = (raw) => (raw === null ? null : JSON.parse(raw))

export const setValue = async ({ key, value, ttl }) => {
  const options = ttl ? { EX: ttl } : undefined
  return redis_client.set(key, encode(value), options)
}

export const setValues = async (entries) => {
  const transaction = redis_client.multi()
  for (const { key, value, ttl } of entries) {
    const options = ttl ? { EX: ttl } : undefined
    transaction.set(key, encode(value), options)
  }
  return transaction.exec()
}

export const updateValue = async ({ key, value, ttl }) => {
  const options = ttl ? { XX: true, EX: ttl } : { XX: true, KEEPTTL: true }
  const result = await redis_client.set(key, encode(value), options)
  return result === 'OK' 
}

export const getValue = async ({ key }) => decode(await redis_client.get(key))

export const getValues = async (entries) => {
  const transaction = redis_client.multi()
  for (const { key, type = 'value' } of entries) {
    if (type === 'ttl') {
      transaction.ttl(key)
    } else if (type === 'value') {
      transaction.get(key)
    } else {
      throw new TypeError(`Unsupported Redis read type: ${type}`)
    }
  }
  const results = await transaction.exec()
  return results.map((result, index) => (
    entries[index].type === 'ttl' ? result : decode(result)
  ))
}

export const getTTL = async ({ key }) => {
  const seconds = await redis_client.ttl(key)
  return seconds
}

export const expire = async ({ key,ttl }) => {
  return await redis_client.expire(key,ttl)
}


export const deleteKey = async (key) => {
  return await redis_client.del(key)
}

export const keys = async (key) => {
  return await redis_client.keys(`${key}*`)
}

export const incr = async (key) => {
  return await redis_client.incr(key)
}

export const exists = async (key) => {
  return await redis_client.exists(key)
}
