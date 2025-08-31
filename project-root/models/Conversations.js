import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  ts: { type: Date, default: Date.now },
});

const EvidenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
});

const ConversationSchema = new mongoose.Schema({
  uid: { type: String, required: true },         // Firebase user id
  slotId: { type: String, required: true },      // unique conversation slot
  title: { type: String, default: 'New Case' },  // optional chat title
  messages: [MessageSchema],
  witnesses: [[String]],
  evidence: [EvidenceSchema],
  description: { type: String, required: false},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Conversation ||
  mongoose.model('Conversation', ConversationSchema);
