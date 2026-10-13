import mongoose from "mongoose";

const revokeTokenSchema =new mongoose.Schema({
    tokenId:{
        type:String,
        required:true,
        trim:true,
    },
    expireAt:Date,
    userId:{
        type:mongoose.Types.ObjectId,
        ref: 'User',
        required:true,
    }
}, {
    timestamps: true,
    strict: 'throw',
    strictQuery: 'throw',

})

revokeTokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

const revokeTokenModel =mongoose.model.revokeToken || mongoose.model('revokeToken',revokeTokenSchema)

export default revokeTokenModel