
import { GoogleGenAI, Type } from "@google/genai";
import { GuideResponse, SportType, PersonaType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (persona: PersonaType) => {
  const instructions = {
    beginner: "Assume ZERO prior knowledge. Use simple language and analogies (e.g., 'it's like tag'). No jargon.",
    new_fan: "Use standard terminology but explain it briefly. Focus on why this play matters in a typical game.",
    hardcore: "Focus on player stats, historical context, team rivalries, and the specific stakes for the season.",
    coach: "Analyze the technical execution, formations, biomechanics, and strategic decision-making."
  };

  return `
    You are a world-class AI Sports Analyst acting as a ${persona.replace('_', ' ')}.
    
    TASK:
    1. Identify the specific game (teams/players, event, year) from the input.
    2. Provide 3-5 'Foundational Rules' for this sport generally.
    3. Analyze the specific moment provided.

    PERSONA RULES (${persona.toUpperCase()}):
    ${instructions[persona]}

    OUTPUT FORMAT (JSON ONLY):
    {
      "identifiedGame": "Specific Match Title (e.g. 2024 Super Bowl - Chiefs vs 49ers)",
      "basicRules": ["Rule 1: Brief explanation", "Rule 2...", "Rule 3..."],
      "whatHappened": "The core analysis based on your persona.",
      "whyReacted": "Why the crowd and players are behaving this way.",
      "nextSteps": "What happens next in this match or situation."
    }
  `;
};

export async function analyzeSportsMoment(
  sport: SportType,
  persona: PersonaType,
  input: string | File,
  isUrl: boolean = false
): Promise<GuideResponse> {
  const model = 'gemini-3-flash-preview';
  
  let contentParts: any[] = [];
  
  if (isUrl) {
    contentParts.push({ text: `Analyze this ${sport} moment from: ${input}.` });
  } else if (input instanceof File) {
    const base64 = await fileToBase64(input);
    contentParts.push({
      inlineData: {
        mimeType: input.type,
        data: base64.split(',')[1],
      },
    });
    contentParts.push({ text: `Analyze this ${sport} visual for a ${persona.replace('_', ' ')}.` });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contentParts },
    config: {
      systemInstruction: getSystemInstruction(persona),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identifiedGame: { type: Type.STRING },
          basicRules: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          whatHappened: { type: Type.STRING },
          whyReacted: { type: Type.STRING },
          nextSteps: { type: Type.STRING },
        },
        required: ["identifiedGame", "basicRules", "whatHappened", "whyReacted", "nextSteps"],
      },
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    throw new Error("Analysis failed. Try describing the play or link a clearer video.");
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
