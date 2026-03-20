import mongoose, { mongo } from "mongoose";

const conversationSchema = new mongoose.Schema({
  particpants: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  lastMessage: {type: mongoose.Schema.Types.ObjectId, ref: 'Message'},
  unreadCount: {type: Number, default: 0}
}, {timestamps: true})

export const conversationModel = mongoose.model('Conversation', conversationSchema)

