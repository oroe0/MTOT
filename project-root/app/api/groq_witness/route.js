import { Groq } from 'groq-sdk';

// Get your API key from environment variables (make sure it's set in your .env file)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req) {
  try {
    // Get the JSON data sent from the frontend (we expect a "message" property)
    const { message, name, title, caseName, description, statement, evidence, messages } = await req.json();

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
                  'You will help a lawyer with practice for a trial. In order to help them, you need to play the role of '+name+
                  'I will tell you how to act, and in order to help this lawyer succeed, you must do exactly as I tell you to. '+

                  'You are '+name+', a '+title+' in '+caseName+'. '+description+
                  'The evidence that has been found includes, '+evidence+
                  'You have previously said '+statement+' regarding the case. You now must expand on that.'+
                  'You will answer questions from a student lawyer, and you must answer them as '+name+
                  'You must speak in first person, and only speak about events you have knowledge about. '+
                  'You should only answer the question, you do not need to talk about evertyhinh you said before or all of the evidence. Focus on answering the question you are asked. '+
                  'You must speak for more than 10 words, and your entire statement should be a single paragraph that is under 60 words. '+
                  'At certain times, it is okay to speak only a little, but generally you should respond with at least 1 sentence. '+
                  'If you are an expert witness, you may speak about what qualifies you. If you did something in this case (such as collect evidence), you must say what you have done and how you did it. '+
                  'You may not make up facts about the case, everything you say regarding the case must be the truth as you know it to be. '+
                  'Your job is very simple, just answer the question that you are asked. '+
                  'You need to provide some additional detail, though too much detail is absolutely horrific and will be very bad. '+
                  'Just before now, you have been asked the following questions and have responded in the following ways. '+
                  messages
                  
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