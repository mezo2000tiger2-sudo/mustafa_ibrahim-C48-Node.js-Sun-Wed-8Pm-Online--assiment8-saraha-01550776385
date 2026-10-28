import mongoose, { Types } from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: {
        type: [{ type: Types.ObjectId, ref: 'User' }],
        required: true,
        immutable: true,
        validate: {
            validator: function (participants) {
                return participants.length === 2 &&
                    participants.every(id => id != null) &&
                    !participants[0].equals(participants[1]);
            },
            message: 'A conversation must have exactly two distinct participants'
        }
    }
}, {
    timestamps: true,
    strict: 'throw',
    strictQuery: 'throw'
});

conversationSchema.index({ participants: 1, createdAt: -1, _id: -1 });

const conversationModel = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
export default conversationModel;
