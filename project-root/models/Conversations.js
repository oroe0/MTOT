import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  ts: { type: Date, default: Date.now },
});

class TopEvidenceArray {
  constructor(array) {
    this.items = [];
    for (let i; i < array.length; i++) {
      this.items[i] = new InsideEvidenceArray(array[i][0],array[i][1]);
    }
  }
}

class InsideEvidenceArray {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }
}

class TopWitnessArray {
  constructor(array) {
    this.items = [];
    for (let i; i < array.length; i++) {
      this.items[i] = new InsideWitnessArray(array[i][0],array[i][1], array[i][2]);
    }
  }
}

class InsideWitnessArray {
  constructor(name, title, statement) {
    this.name = name;
    this.title = title;
    this.statement = statement;
  }
}

const ConversationSchema = new mongoose.Schema({
  uid: { type: String, required: true },         // Firebase user id
  slotId: { type: String, required: true },      // unique conversation slot
  title: { type: String, default: 'New Chat' },  // optional chat title
  messages: [MessageSchema],
  // witnesses: { type: TopWitnessArray, required: false },
  // evidence: { type: TopEvidenceArray, required: false},
  description: { type: String, required: false},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Conversation ||
  mongoose.model('Conversation', ConversationSchema);
