import mongooseConnect from '@/lib/mongoose';
import Conversation from '@/models/Conversations';

export async function POST(req) {
  try {
    const { User } = await req.json()

    // Find and delete all conversations where this uid is in `participants`
    const result = await Conversation.deleteMany({ uid: User })

    console.log(`${result.deletedCount} conversations deleted for user ${User}`)

    return NextResponse.json({ message: "DELETE request worked" })
  } catch (err) {
    console.error("Error deleting conversations:", err)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  }
}