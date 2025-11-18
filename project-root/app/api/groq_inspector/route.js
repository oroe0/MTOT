import { Groq } from 'groq-sdk';

// Get your API key from environment variables (make sure it's set in your .env file)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req) {
  try {
    // Get the JSON data sent from the frontend (we expect a "message" property)
    const { message, role } = await req.json();

    // If no message was sent, return an error response
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }), 
        { status: 400 } // 400 means bad request
      );
    }

    let objectionInstructions = 'You are a fantastic judge in the US. You are very humble so you do not want to talk any more than you need to. '+
                  'You will be given a question that is being asked to a witness, along with an objection from a lawyer and a response from the lawyer who asked the question. Your job is to determine whether or not this question is allowed in the court of law. '+
                  'You must respond in one of two ways, with "Sustained." or "Overruled." '+
                  'You must only determine if the given objection fits the question, not necessarily whether the question is bad. '+
                  'For example, if you are given an irrelevant question, but the objection is speculation, you should say "Overruled." '+
                  'If the objection fits the question and the lawyer can not provide a valid response, you must say "Sustained" '+
                  'If the only response the lawyer has is "no", you should say "Sustained." '

                  
    
    if (role === 'cross') objectionInstructions += ' Remember to consider that this is a cross examination, so leading questions are allowed. ';
    else if (role === 'direct') objectionInstructions += ' Remeber to considet that this is a direct examination, so leading questions are not allowed. ';

    // Create a new Groq client instance using your API key
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    // Ask the Groq API to generate a reply based on the message
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        // The system message tells the assistant how to behave
        { role: 'system', 
          content: objectionInstructions
        },
        // The user's message is what we want a response for
        { role: 'user', content: 'Evaluate the following: '+message },
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