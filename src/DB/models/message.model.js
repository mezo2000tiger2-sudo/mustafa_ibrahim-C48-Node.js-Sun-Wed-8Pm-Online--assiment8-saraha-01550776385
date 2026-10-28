import mongoose, { Types } from "mongoose";
import "./conversation.model.js";

const messageSchema =new mongoose.Schema({
    content:{
        type:String,
        required:function(){
            return this.attachments?.length ? false:true
        }, 
        trim:true
    },
    attachments:[String],
    recevierId:{
        type:Types.ObjectId,
        ref:'User',
        required:true,
        immutable:true
    },
    senderId:{
        type:Types.ObjectId,
        ref:'User',
        required:function(){
            return this.conversationId != null
        },
        immutable:true,
        select:false
    },
    conversationId:{
        type:Types.ObjectId,
        ref:'Conversation',
        default:null
    }
},{
    timestamps: true,
    strict: 'throw',
    strictQuery: 'throw',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
}
)

messageSchema.index({conversationId:1,createdAt:-1,_id:-1})

const messageModel =mongoose.models.Message || mongoose.model('Message',messageSchema)
export default messageModel
