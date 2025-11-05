import { Groq } from 'groq-sdk';

// Get your API key from environment variables (make sure it's set in your .env file)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req) {
  try {
    // Get the JSON data sent from the frontend (we expect a "message" property)
    const { message, desription, title, statement } = await req.json();

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
                  'You are a fantastic lawyer in the US. '+
                  'You will be given a question that is being asked to a witness. Your job is to determine whether or not this question is allowed in the court of law. '+
                  'You must respond in one of two ways, with "No Objection.", or with "Objection your Honor, _____!" The blank is the type of objection. '+
                  'For example, you might object that the given question is irrelevant by saying "Objection your Honor, relevance!". '+
                  'Sometimes, the question you are given does not warrant an objection, so you should say "No Objection.". '+
                  'The question that you are given is from the following case: '+desription+
                  'This question is being asked to a '+title+' who previously has made this statement to the police '+statement+
                  'Make sure that your determination is correct, because it is bad to object when there is no error, and bad to not object when the question is bad. '
        },
        // The user's message is what we want a response for
        { role: 'user', content: 'Evaluate this question: '+message },
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