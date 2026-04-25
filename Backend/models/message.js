import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: { type: String },
  imageOrVideoUrl: { type: String },
  contentType: { type: String, enum: ['image', 'text', 'video', 'audio'] },
  reactions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      emoji: String
    }
  ],
  messageStatus: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  deletedFor: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}]
}, { timestamps: true });

export const messageModel = mongoose.model('Message', messageSchema)
