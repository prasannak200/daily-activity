
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface MusicDiscoveryResult {
  text: string;
  links: { title: string; uri: string }[];
}

export const geminiService = {
  suggestTasks: async (userContext: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this goal or context: "${userContext}", suggest 3-5 specific, actionable daily tasks. Keep them concise.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
              },
              required: ['title', 'priority']
            }
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini AI error:", error);
      return [];
    }
  },

  findMusic: async (query: string): Promise<MusicDiscoveryResult> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // High quality for search
        contents: `Find me high-quality focus music or playlists on Google/YouTube Music for: "${query}". Provide a helpful summary of why these are good for productivity.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "Here is what I found on Google Music:";
      const links: { title: string; uri: string }[] = [];

      // Extract links from grounding chunks
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            links.push({
              title: chunk.web.title,
              uri: chunk.web.uri
            });
          }
        });
      }

      return { text, links };
    } catch (error) {
      console.error("Music discovery error:", error);
      return { text: "Sorry, I couldn't connect to Google Music search right now.", links: [] };
    }
  }
};
