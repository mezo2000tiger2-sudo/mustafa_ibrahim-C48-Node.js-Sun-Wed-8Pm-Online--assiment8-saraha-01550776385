import express from "express";
import connectDb from "./DB/connectionDB.js";
import userRouter from "./DB/modules/user/user.controller.js";
import cors from 'cors'
import connectRedis, { redis_client } from "./DB/connection.redis.js";
import messagesRouter from "./DB/modules/messages/messages.controller.js";
import {unlink} from 'node:fs/promises'
const port = 3000;
const app  = express();
const bootstrap = async () => {

    const results = await Promise.allSettled([
        connectDb(port, app),
        connectRedis(),
    ]);
    

    app.use(express.json());
    app.use(cors({
        origin:'*'
    }));
    
    app.get('/',(req,res)=>{
        res.status(200).send('welocem on my app.....')
    })

    
    app.use('/user',userRouter)
    app.use('/message',messagesRouter)

    app.use('{*demo}', (req, res) => {
        throw new Error(`the endpoint ${req.originalUrl} and the method ${req.method} are not found`,{cause:404})
    });

    app.use(async(err, req, res, next) => {
    const files = [
        ...(req.file ? [req.file] : []),
        ...(req.files ?? [])
    ];

    await Promise.all(files.map(file =>
    unlink(file.path).catch(error => {
        if (error.code !== "ENOENT") {
            console.error("Failed to delete uploaded file:", error.message);
        }
    })
    ));
        if(err.code ==11000){
            return res.status(404).json({message:'error',error:err.message})
        }
        console.error(err.stack);
        res.status(err.cause || 500).send({message:'error',error:err.message ,details:err.details? err.details : undefined});
    });
}
export default bootstrap;