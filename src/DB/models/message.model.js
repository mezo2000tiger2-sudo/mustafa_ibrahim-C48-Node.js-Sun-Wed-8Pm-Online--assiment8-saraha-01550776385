import mongoose, { Types } from "mongoose";

const messageSchema =new mongoose.Schema({
    content:{
        type:String,
        required:function(){
            return this.attachments?.lenght ? false:true
        }, 
        trim:true
    },
    attachments:[String],
    userId:{
        type:Types.ObjectId,
        ref:'User',
        required:true
    }
},{
    timestamps: true,
    strict: 'throw',
    strictQuery: 'throw',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
}
)
const messageModel =mongoose.model.message || mongoose.model('Message',messageSchema)
export default messageModel