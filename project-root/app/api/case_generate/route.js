import mongooseConnect from '@/lib/mongoose';
import Conversation from '@/models/Conversations';

export async function POST(req) {
  try {
    const { uid, slotId, witnesses, evidence, description, title } = await req.json();

    console.log('\t\t testing something')

    if (!uid || !slotId || !witnesses /**|| !evidence*/ || !description || !title ) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    await mongooseConnect();
    const now = new Date();

    const conversation = await Conversation.findOneAndUpdate(
      { uid, slotId },
      {
        $setOnInsert: { uid, slotId, createdAt: now },
        $set: { 
            updatedAt: now, 
            title: title,
            witnesses: witnesses,
            evidence: evidence,
            description: description,
        },
      },
      { new: true, upsert: true }
    );

    console.log('\t\t functioned?')

    return new Response(JSON.stringify(conversation), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST conversation error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}