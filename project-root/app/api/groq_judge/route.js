import { Groq } from 'groq-sdk';

// Get your API key from environment variables (make sure it's set in your .env file)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req) {
  try {
    // Get the JSON data sent from the frontend (we expect a "message" property)
    const { message, side, role } = await req.json();

    // If no message was sent, return an error response
    if (!message || !side || !role) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }), 
        { status: 400 } // 400 means bad request
      );
    }

    let contentStatement = 'You are a fantastic judge in the US. '+
                  'You have been asked to help with highschool mock trial, and your role will be as the judge. '+
                  'When I send you a list of messages, you need to grade them and give feedback. '+
                  'You should first give a score from 1 to 10, with 1 being terrible, and 10 being fantastic. '+
                  'Treat the person being judged like an actual lawyer. If they use all caps at odd times, or just seem wierd and unprofessional, do not hesitate to give them a 1 or 2. '+
                  'You should be very harsh with your scoring, almost never give 10s, because a 10 means perfection. '+
                  'If the person is very very good, responds to objections well, is very professional, has good questions, and understands the topic, you can give them a 9. '+
                  'This does not mean to be unfair, as a judge, you must always be fair. '+
                  'If this person was really in court, how well would they do. Evaluate them as if they were a professional lawyer or a real witness. '

    if (role === 'statements') {
      contentStatement += 'You should only give feedback to the '+side+', do not give feedback to both sides, even if there are two different people talking. '+
                  'Because opening or closing statements are being given, only give feedback to the person who gave the '+side+' statement. '
    }
    else if (role === 'direct') {
      contentStatement += 'You should only give feedback to the lawyer who is speaking. You can almost ignore the witness. '+
                  'The lawyer will be asking questions, and they should not be leading questions, or yes or no questions. They should be broad, but not super broad. '+
                  'The lawyer should sound professional, and be getting all of the important information the witness knows. They are helping the witness. '
    }
    else if (role === 'witness') {
      contentStatement += 'You should only give feedback to the witness, you can ignore the lawyer. '+
                  'The witness must answer the question, but should answer it in a way that makes them look good. '+
                  'They need to be honest, but also avoid the attacks of the lawyer. '
    }
    else if (role === 'cross') {
      contentStatement += 'You should only give feedback to the lawyer, you can ignore the witness. The lawyer will be the one asking questions. '+
                  'The lawyer should attack the witness, but not be too agressive. They need to poke holes in the witness testimony. '
    }
    else if (role === 'whole') {
      contentStatement += ''
    }

    contentStatement += 'Your feedback must be 3 sentences, in addition to the grade. Make sure to include some things that the person could improve. '+
                  'Do not mention your verdict as a judge, or which side you are leaning towards, only mention the quality of the work and how it can be improved. '+
                  'You should first say "YOUR SCORE IS: __/10" where the blank is the score they recieved. Then tell them how to improve and why they got that score. '
    





    // Create a new Groq client instance using your API key
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    // Ask the Groq API to generate a reply based on the message
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        // The system message tells the assistant how to behave
        { role: 'system', 
          content: contentStatement,
        },
        // The user's message is what we want a response for
        { role: 'user', content: message },
      ],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', // The AI model to use
      temperature: 1,              // Controls randomness: 1 = normal, 0 = deterministic
      max_completion_tokens: 1024, // Max length of the reply
      top_p: 1,                   // Controls diversity of the output
      stream: false,              // false means wait for full response, no partial streaming
      stop: null,                 // No special stopping condition
    });

    // Extract the text reply from the API response
    const reply = chatCompletion.choices[0]?.message?.content || 'No response.';

    // Send back the reply as JSON with status 200 (OK)
    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // If something goes wrong, log the error for debugging
    console.error('Groq API Error:', error);

    // Return a generic error message with status 500 (server error)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500 }
    );
  }
}