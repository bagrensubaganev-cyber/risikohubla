
import { GoogleGenAI } from "@google/genai";
// Fix: Changed FormSubmission to RiskProfileSubmission to match existing types
import { RiskProfileSubmission } from "../types";

// Fix: Updated parameter type to RiskProfileSubmission[]
export const getAIAnalysis = async (submissions: RiskProfileSubmission[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fix: Map over the entire submission object since 'selections' property does not exist on RiskProfileSubmission
  const summary = submissions.map(s => JSON.stringify(s)).join("\n");
  
  const prompt = `
    Analisis data submission berikut dari aplikasi kuesioner. 
    Berikan ringkasan tren utama, pola yang menarik, dan saran tindak lanjut dalam Bahasa Indonesia.
    Gunakan format markdown yang rapi.
    
    Data:
    ${summary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "Maaf, gagal menganalisis data saat ini.";
  }
};
