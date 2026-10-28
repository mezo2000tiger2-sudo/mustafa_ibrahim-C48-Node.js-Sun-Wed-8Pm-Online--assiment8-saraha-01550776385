import messageModel from "../../models/message.model.js";
import userModel from "../../models/user.model.js";
import * as dbService from "../../service/db.service.js";
import { isObjectIdOrHexString } from "mongoose";
 
//================ createMessage ==========================

export async function createMessage(req,res){
  const {content , recevierId} =req.body
  if(!content && !req.files.length)throw new Error('content is required')
    const userExists=await dbService.findById({
      model:userModel,
      id:recevierId
  })
  if(!userExists)throw new Error('user not exist')
    let urls =[]
  if(req.files.length ){
    for (const file of req?.files) {
      urls.push(file.path)
    }
  }
  const message =await dbService.create({
    model:messageModel,
    data:{
      content,
      attachments:urls,
      recevierId,
      ...(req.user ? { senderId: req.user._id } : {})
    }
  })
  return res.status(200).json({message:'done',message})
}
//================ getMessages ==========================

export async function getMessages(req,res){
  const filter = {
      recevierId:req.user._id
    }


  const page = Number(req.query.page ?? 1);
  const size = Number(req.query.size ?? 5);
  const skip = (page - 1) * size;

  if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(size) || size < 1 ||
      !Number.isSafeInteger(skip)) {
    throw new Error('page and size must be positive integers within a safe range', { cause: 400 });
  }

    const pages =Math.ceil( await dbService.countDocuments({model:messageModel,filter})/size)

  const messages =await dbService.find({
    model:messageModel,
    filter,
    options:{select:'-senderId',limit:size,skip,sort:{createdAt:-1,_id:-1}}
  })
    return res.status(200).json({message:'done',data:{messages,page ,pages ,size}})
}
//================ getSentMessages ==========================

export async function getSentMessages(req,res){
  const filter ={
      senderId:req.user._id
    }

  const page = Number(req.query.page ?? 1);
  const size = Number(req.query.size ?? 5);
  const skip = (page - 1) * size;
  if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(size) || size < 1 ||
      !Number.isSafeInteger(skip)) {
    throw new Error('page and size must be positive integers within a safe range', { cause: 400 });
  }

  const pages =Math.ceil( await dbService.countDocuments({model:messageModel,filter})/size)

  const messages =await dbService.find({
    model:messageModel,
    filter,
    options:{select:'-senderId',limit:size,skip,sort:{createdAt:-1,_id:-1}}
  })
  return res.status(200).json({message:'done',data:{messages,page ,pages ,size}})
}

//================ getMessageById ==========================

export async function getMessageById(req,res){
  if (!isObjectIdOrHexString(req.params.id)) {
    throw new Error('invalid message id', { cause: 400 });
  }
  const message =await dbService.findOne({
    model:messageModel,
    filter:{
      _id:req.params.id,
      $or:[
        {recevierId:req.user._id},
        {senderId:req.user._id},
      ]
    },
    options:{senderId:0}
  })
  if (!message) {
    throw new Error("message not found", { cause: 404 });
  }
    return res.status(200).json({message:'done',message})
}
