import {config} from 'dotenv'
import {resolve} from 'node:path'

const NODE_ENV =process.env.NODE_ENV

const envPath ={
    development :'.env.development',
    production :'.env.production',
}

config({path:resolve(`config/${envPath[NODE_ENV]}`)})

export const PORT = +process.env.PORT
export const IV_LENGTH = +process.env.IV_LENGTH
export const DB_URI= process.env.DB_URI
export const REDIS_URI= process.env.REDIS_URI
export const ENCRYPT_KEY= process.env.ENCRYPT_KEY
export const EMAIL= process.env.EMAIL
export const PASSWORD= process.env.PASSWORD
export const ALLOW_ORIGINS= process.env.ALLOW_ORIGINS.split(',') || []
