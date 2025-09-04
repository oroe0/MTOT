import mongooseConnect from '@/lib/mongoose';
import Conversation from '@/models/Conversations';
import { randomUUID } from 'crypto';

export async function POST(req) {
  try {
    const { uid, role } = await req.json();
    if (!uid || !role) return new Response(JSON.stringify({ error: 'Missing uid or role' }), { status: 400 });

    await mongooseConnect();
    const slotId = randomUUID();

    const conversation = await Conversation.create({
      uid,
      slotId,
      title: 'New Chat',
      role: role,
      messages: [],
    });

    return new Response(JSON.stringify(conversation), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('NEW conversation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}