import { GoogleGenAI, Type } from "@google/genai";
import { SuggestedEquipment, SuggestedQuote } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateEnhancedDescription(userInput: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Com base na seguinte solicitação de um cliente para um serviço de 'marido de aluguel': "${userInput}", elabore uma descrição detalhada e clara do problema. A resposta deve ser apenas o texto da descrição aprimorada, em português.`,
        config: {
            temperature: 0.7,
        },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating description:", error);
    return "Não foi possível gerar a descrição. Por favor, tente novamente.";
  }
}

export async function suggestEquipmentForJob(jobDescription: string): Promise<SuggestedEquipment> {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Para o seguinte trabalho de reparo doméstico, liste as ferramentas e materiais possivelmente necessários: "${jobDescription}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tools: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de ferramentas necessárias."
              },
              materials: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de materiais necessários."
              }
            },
            required: ["tools", "materials"],
          },
        },
    });
    
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error suggesting equipment:", error);
    return { tools: ["Erro ao sugerir ferramentas"], materials: ["Erro ao sugerir materiais"] };
  }
}

export async function suggestQuote(jobDescription: string): Promise<SuggestedQuote> {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Com base na descrição do serviço a seguir, forneça uma sugestão de orçamento. A descrição é: "${jobDescription}". Responda em JSON com uma faixa de preço (priceRange) e um detalhamento do orçamento (quoteDetails) justificando o valor. O público é um prestador de serviços (marido de aluguel) no Rio de Janeiro, Brasil. A moeda é BRL (R$).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priceRange: {
                type: Type.STRING,
                description: "Uma faixa de preço sugerida para o serviço. Ex: 'R$ 150,00 - R$ 250,00'"
              },
              quoteDetails: {
                type: Type.STRING,
                description: "Um texto detalhando o que está incluso no orçamento e justificando o valor."
              }
            },
            required: ["priceRange", "quoteDetails"],
          },
        },
    });
    
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error suggesting quote:", error);
    return { 
        priceRange: "Erro", 
        quoteDetails: "Não foi possível gerar uma sugestão de orçamento. Verifique os detalhes do serviço e tente novamente." 
    };
  }
}