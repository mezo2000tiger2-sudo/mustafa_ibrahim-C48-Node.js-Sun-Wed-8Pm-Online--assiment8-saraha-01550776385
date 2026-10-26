import messageModel from "../../models/message.model.js";
import userModel from "../../models/user.model.js";
import * as dbService from "../../service/db.service.js";
 
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
  const messages =await dbService.find({
    model:messageModel,
    filter:{
      recevierId:req.user._id
    },
    options:{select:'-senderId'}
  })
    return res.status(200).json({message:'done',messages})
}
//================ getSentMessages ==========================

export async function getSentMessages(req,res){
  const messages =await dbService.find({
    model:messageModel,
    filter:{
      senderId:req.user._id
    },
    options:{select:'-senderId'}
  })
  return res.status(200).json({message:'done',messages})
}

//================ getMessageById ==========================

export async function getMessageById(req,res){
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
