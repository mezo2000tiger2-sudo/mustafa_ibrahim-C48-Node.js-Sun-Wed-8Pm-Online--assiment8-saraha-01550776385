import express from "express";
import connectDb from "./DB/connectionDB.js";
import userRouter from "./DB/modules/user/user.controller.js";
import cors from 'cors'
const port = 3000;
const app  = express();
const bootstrap = async () => {

    await connectDb(port, app);
    app.use(express.json());
    app.use(cors({
        origin:'*'
    }));
    
    app.get('/',(req,res)=>{
        res.status(200).send('welocem on my app.....')
    })

    
    app.use('/user',userRouter)

    app.use('{*demo}', (req, res) => {
        throw new Error(`the endpoint ${req.originalUrl} and the method ${req.method} are not found`,{cause:404})
    });

    app.use((err, req, res, next) => {
        if(err.code ==11000){
            return res.status(404).json({message:'error',error:err.message})
        }
        console.error(err.stack);
        res.status(err.cause || 500).send({message:'error',error:err.message ,details:err.details? err.details : undefined});
    });
}
export default bootstrap;