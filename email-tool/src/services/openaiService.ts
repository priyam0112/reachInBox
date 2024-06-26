import axios from 'axios';

export async function analyzeEmail(content: string): Promise<string> {
  // Replace with actual OpenAI API call
  const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
    prompt: `Analyze this email content and categorize it: ${content}`,
    max_tokens: 10,
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });

  return response.data.choices[0].text.trim();
}

export async function generateResponse(prompt: string): Promise<string> {
  const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
    prompt: prompt,
    max_tokens: 100,
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });

  return response.data.choices[0].text.trim();
}
