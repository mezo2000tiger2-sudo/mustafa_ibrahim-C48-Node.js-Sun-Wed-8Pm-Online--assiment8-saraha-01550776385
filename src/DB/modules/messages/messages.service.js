import messageModel from "../../models/message.model.js";
import userModel from "../../models/user.model.js";
import * as dbService from "../../service/db.service.js";


export async function createMessage(req,res){
  const {content , userId} =req.body
  if(!content && !req.files.length)throw new Error('content is required')
    const userExists=await dbService.findById({
      model:userModel,
      id:userId
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
      userId
    }
  })
  return res.status(200).json({message:'done',message})
}