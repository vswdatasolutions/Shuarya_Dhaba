import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateMenuDescription = async (itemName: string, ingredients: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key not found");
    return "Delicious authentic dish prepared with fresh ingredients.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Write a short, mouth-watering description (max 25 words) for a restaurant menu item named "${itemName}" containing these ingredients: ${ingredients}. Make it sound rustic and authentic for a Dhaba.`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Freshly prepared with authentic spices.";
  }
};

export const getSmartRecommendations = async (currentOrderNames: string[]): Promise<string[]> => {
    if (!apiKey || currentOrderNames.length === 0) return [];

    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Based on these items in a customer's cart: ${currentOrderNames.join(', ')}, suggest 3 other short item names (comma separated) that would pair well in an Indian Dhaba setting.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });

        const text = response.text;
        return text.split(',').map(s => s.trim());
    } catch (error) {
        console.error("Gemini Recommendation Error", error);
        return [];
    }
}