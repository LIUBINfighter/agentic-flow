import { RequestUrlParam, requestUrl } from "obsidian";

export class AIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(messages: any[]): Promise<string> {
    try {
      const params: RequestUrlParam = {
        url: this.baseUrl,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages.map(msg => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content
          }))
        })
      };

      const response = await requestUrl(params);
      if (response.status === 200) {
        return response.json.choices[0].message.content;
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('AI response generation failed:', error);
      throw error;
    }
  }
}
