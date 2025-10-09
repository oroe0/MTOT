import { Groq } from 'groq-sdk';

// Get your API key from environment variables (make sure it's set in your .env file)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req) {
  try {
    // Get the JSON data sent from the frontend (we expect a "message" property)
    const { message, side } = await req.json();

    // If no message was sent, return an error response
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }), 
        { status: 400 } // 400 means bad request
      );
    }

    // Create a new Groq client instance using your API key
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    // Ask the Groq API to generate a reply based on the message
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        // The system message tells the assistant how to behave
        { role: 'system', 
          content: 
                  'You are a fantastic judge in the US. '+
                  'You have been asked to help with highschool mock trial, and your role will be as the judge. '+
                  'When I send you a list of messages, you need to grade them and give feedback. '+
                  'You should first give a score from 1 to 10, with 1 being terrible, and 10 being fantastic. '+
                  'You should  only give feedback to the '+side+', do not give feedback to both sides, even if there are two different people talking. '+
                  'You may need to give feedback for various different roles, such as the opening statement, cross examination, direct examination, or feedback for the witness themself. '+
                  'If a witness is being direct examined, give feedback to the lawyer (the direct examiner), not to the witness. '+
                  'If a witness is being cross examined, give feedback to whichever person is on the '+side+
                  'If opening or closing statements are being given, give feedback to the person who gave the '+side+' statement. '+
                  'Your feedback must be 3 sentences or less, in addition to the grade. Make sure to include some things that the person could improve. '+
                  'Do not mention your verdict as a judge, or which side you are leaning towards, only mention the quality of the work and how it can be improved. '+
                  'You should first say "YOUR SCORE IS: __" where the blank is the score they recieved. Then tell them how to improve and why they got that score. '
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
    console.log(message)

    // Send back the reply as JSON with status 200 (OK)
    console.log("\t\t Testing")
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