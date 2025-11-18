

import { InferenceClient } from "@huggingface/inference";
const fs = require('fs')

const HF_TOKEN = process.env.HF_TOKEN;


export async function POST(req) {
  try {
    // Get the JSON data sent from the frontend (we expect a "message" property)
    const { prompt } = await req.json();

    // If no message was sent, return an error response
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'No prompt provided' }), 
        { status: 400 } // 400 means bad request
      );
    }

    // Create a new HF Inference client instance using your API key
    const client = new InferenceClient(HF_TOKEN);

    // Ask the API to generate a reply based on the message
    const image = await client.textToImage({
        provider: "hf-inference",
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        inputs: prompt,
        parameters: { num_inference_steps: 5, height: 1024, width: 1024 },
    });

    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    fs.writeFile('test.jpg', buffer, (err) => {
        if (err) {
            console.log('errror'+ err)
        }
        else { 
            console.log('Image made')
        }
    })

    // Send back the reply as JSON with status 200 (OK)
    return new Response(
      JSON.stringify({ reply: 'ay okay' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // If something goes wrong, log the error for debugging
    console.error('HF API Error:', error);

    // Return a generic error message with status 500 (server error)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500 }
    );
  }
}