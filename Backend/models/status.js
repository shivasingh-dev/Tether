import mongoose from 'mongoose'

const statusSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  content: {type: String, required: true},
  contentPublicId: {type: String},
  contentType: {type: String, enum: ['image', 'text'], default: 'text'},
  viewers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  expiresAt: {type: Date, required: true}
}, {timestamps: true})

export const statusModel = mongoose.model('Status', statusSchema)