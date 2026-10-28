import mongoose, { Types } from "mongoose";

const identityRequestSchema = new mongoose.Schema({
    messageId: {
        type: Types.ObjectId,
        ref: 'Message',
        required: true,
        unique: true,
        immutable: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true,
    strict: 'throw',
    strictQuery: 'throw'
});

const identityRequestModel = mongoose.models.IdentityRequest || mongoose.model('IdentityRequest', identityRequestSchema);
export default identityRequestModel;
