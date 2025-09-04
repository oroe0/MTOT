import mongooseConnect from '@/lib/mongoose';
import Conversation from '@/models/Conversations';

export async function POST(req) {
  try {
    const { uid, slotId, witnesses, evidence, description, title, personOfInterest} = await req.json();

    if (!uid || !slotId || !witnesses || !evidence || !description || !title || !personOfInterest ) {
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
            witnesses: JSON.stringify(JSON.parse(witnesses)),
            evidence: JSON.stringify(JSON.parse(evidence)),
            description: description,
            personOfInterest: personOfInterest,
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