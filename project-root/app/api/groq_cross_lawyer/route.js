import { Groq } from 'groq-sdk';

// Get your API key from environment variables (make sure it's set in your .env file)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req) {
  try {
    // Get the JSON data sent from the frontend (we expect a "message" property)
    const { message, name, title, caseName, description, statement, evidence, messages } = await req.json();

    // If no message was sent, return an error response
    if ( !name || !title || !caseName || !description || !statement || !evidence ) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }), 
        { status: 400 } // 400 means bad request
      );
    }
    let theMessage = message;
    if (theMessage === '') {
      theMessage = 'Begin Cross-Examination.';
    }

    let contentMessage = 'You are a fantastic lawyer in the US. '+
                          //'You are going to cross examine a terrible unethical human being whose fate is in your hands. If you do a good enough job, the world will be a better place. '+
                          'You will cross examine '+name+' in '+caseName+'. '+description+'. '+name+' is a '+title+' and has said '+statement+
                          'In addition, the following evidence may be relevent to the case. '+evidence+
                          'You need to ask '+name+' one question as if you are a cross examination lawyer cross-examining them. '+
                          'Make sure your question is reletively short. It should not be longer than two sentences. '+
                          'You must ask a leading question, this means a question that would usually be answered with either yes or no. '+
                          'You should not ask compound questions, or questions that ask two seperate things. '+
                          'You can make the questions more simple in order to insure that you do not ask compound questions'+
                          'Do not ask multiple questions, and do not make a statement, only ask 1 leading question. '+
                          'Do not say anything else except for the question. Do not include sentences or words before or after the question. '
                        

    if (messages === '') {
      contentMessage += 'Just before now, you have asked the following questions and the witness has responded in the following ways. '+
                        messages
    }

    // Create a new Groq client instance using your API key
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    // Ask the Groq API to generate a reply based on the message
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        // The system message tells the assistant how to behave
        { role: 'system', 
          content: contentMessage,
        },
        // The user's message is what we want a response for
        { role: 'user', content: theMessage },
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