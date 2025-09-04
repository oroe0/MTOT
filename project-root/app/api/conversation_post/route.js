import mongooseConnect from '@/lib/mongoose';
import Conversation from '@/models/Conversations';

export async function POST(req) {
  try {
    const { uid, slotId, userMessage, botMessage, isOpen } = await req.json();

    if (!uid || !slotId || !userMessage || !botMessage || !isOpen ) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    await mongooseConnect();
    const now = new Date();

    const conversation = await Conversation.findOneAndUpdate(
      { uid, slotId },
      {
        $setOnInsert: { uid, slotId, createdAt: now },
        $set: { updatedAt: now, isOpen: isOpen },
        $push: {
          messages: [
            { sender: 'user', text: userMessage, ts: now },
            { sender: 'bot', text: botMessage, ts: now },
          ],
        },
      },
      { new: true, upsert: true }
    );

    return new Response(JSON.stringify(conversation), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST conversation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}