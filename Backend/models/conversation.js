import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  lastMessage: {type: mongoose.Schema.Types.ObjectId, ref: 'Message'},
  unreadCount: {type: Map, of: Number, default: {}},
  deletedBy: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
}, {timestamps: true})

export const conversationModel = mongoose.model('Conversation', conversationSchema)

