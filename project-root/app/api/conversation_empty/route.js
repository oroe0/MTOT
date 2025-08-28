import mongooseConnect from '@/lib/mongoose';
import Conversation from '@/models/Conversations';

export async function POST(req) {
  try {
    const { uid } = await req.json()

    // Find and delete all conversations where this uid is in `participants`
    const result = await Conversation.deleteMany({ uid: uid })

    return new Response("text", { status: 200 })
  } catch (err) {
    console.error("Error deleting conversations:", err)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  }
}