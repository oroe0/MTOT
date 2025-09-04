import { Groq } from 'groq-sdk';

// Get your API key from environment variables (make sure it's set in your .env file)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req) {
  try {
    // Get the JSON data sent from the frontend (we expect a "message" property)
    const { message } = await req.json();

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
                  'You are very humble, so you will not speak using real words very much, and you will do exactly as you are told. '+
                  'You know all of the major cases from the last 100 years, and can take inspiration from them to make new cases. '+

                  'When I ask you to generate a case, do not speak to me. Only make the following files, and do not use unnecesary words or characters before or after your response. '+

                  'Directly before the first file, you must include a @ character, and no \' characters. '+
                  'First give me a list of 6 witnesses in an array. There should be 3 witnesses for each side. '+
                  'This means that the first 3 witnesses should support the prosecuter and their case. The last 3 witnesses should support the defense and their case. '+
                  'It should include the name of each witness and their title. '+
                  'It should also include a statement that is over 25 words. '+
                  'The statement should be as if the witness is talking. '+
                  'For example, if you were to give a statement from the investigator for the prosecution, it might be "When I arrived at the scene, I found the defendent\'s phone on the ground, covered in the victim\'s blood." '+
                  'The file should look like [["...","...","..."],["...","...","..."],...]. '+
                  'Directly after the witness file, you must put a @ character. '+

                  //'Directly before the second file, you must include a @ character. '+
                  'Directly after the @ character, give me 4 pieces of non-spoken evidence from the trial in an array. '+
                  'This means that you should respond with [["Bloody Fingerprint", "A fingerprint of blood from Joe on his doorhandle."], ["...","..."], ...]. '+
                  'Non-spoken evidence can include relevant notes and letters, or basic pieces of DNA. Each item of evidence should have a name and a description under 25 words. '+
                  'The array should hold an array for each piece of evidence, and each of THOSE arrays must contain 2 strings. '+
                  'The first string should be the name of the evidence, and the second string should be the description of the evidence. '+
                  'If a piece of writing is provided, the entirety of what was written should be included in the description. '+
                  'The description should be roughly a paragraph, or 25 words. '+
                  'After the evidence JSON file, you should put a @ character. '+

                  'Then, give me another file, contained in brackets. '+
                  'This file should look like [ "str1", "str2", "str3" ]. '+
                  'The first string should be the name of the prosecutor, and the second should be the name of the defendent. '+
                  'The third string should be a brief description of the case and what the defendent is accused of. '+
                  'For example, if this was a robbery case, you might say [ "The State of Montana", "Billy Guiterez", "Billy Guiterez is accused of robbing his neighbors house of valuable paintings." ]. '+
                  'If it is a federal crime, than the prosecuter should be The United States of America. If it is a civil issue, than the prosecuter should be the person who brought the complaint. '+

                  'Your response must include EXACTLY 3 @ characters. '
        },
        // The user's message is what we want a response for
        { role: 'user', content: message },
      ],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', // The AI model to use
      temperature: 2,              // Controls randomness: 1 = normal, 0 = deterministic
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