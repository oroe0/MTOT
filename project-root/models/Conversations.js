import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  ts: { type: Date, default: Date.now },
});

const ConversationSchema = new mongoose.Schema({
  uid: { type: String, required: true },         // Firebase user id
  slotId: { type: String, required: true },      // unique conversation slot
  title: { type: String, default: 'New Case' },  // optional chat title
  messages: [MessageSchema],
  witnesses: { type: String, default: '[]' },
  evidence: { type: String, default: '[]' },
  description: { type: String, default: 'empty case'},
  role: { type: String, enum: ['witness', 'statements', 'direct', 'cross', 'whole'], default: 'direct' },
  personOfInterest: { type: Number, required: false },
  side: { type: String, enum: ['prosecution', 'defense'], default: 'defense' },
  isOpen: { type: Boolean, default: true },
  questions: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Conversation ||
  mongoose.model('Conversation', ConversationSchema);
