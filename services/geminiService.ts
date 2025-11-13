import { GoogleGenAI, Modality, Part, Type } from '@google/genai';
import { GeneratedPosts, ProductDetails } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const recognizeProductInImage = async (imageParts: Part[]): Promise<string> => {
  if (!imageParts || imageParts.length === 0) {
    return "";
  }
  const prompt = "Analise a primeira imagem e identifique o produto principal. Retorne apenas o nome completo do produto (incluindo marca, se visível), sem nenhuma outra palavra, descrição ou pontuação.";
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imageParts[0], { text: prompt }] },
    });
    return response.text.trim();
  } catch (e) {
    console.error("Failed to recognize product:", e);
    return ""; // Retorna string vazia em caso de erro
  }
};

const generateCaptions = async (imageParts: Part[], details: ProductDetails): Promise<{ instagram: string, facebook: string, twitter: string }> => {
  let prompt = `
Você é um especialista em marketing de redes sociais. Sua tarefa é criar legendas para um post sobre um produto para Instagram, Facebook e Twitter. A arte do post é uma imagem quadrada.

**Instruções:**
1.  Analise as imagens do produto.
2.  Use os detalhes abaixo para criar as legendas.
3.  Crie uma legenda para CADA UMA das seguintes plataformas: Instagram, Facebook, e Twitter.
4.  **Instagram:** Tom aspiracional, use emojis, parágrafos curtos e de 3 a 5 hashtags relevantes.
5.  **Facebook:** Tom um pouco mais informativo, talvez um pouco mais longo, com um call-to-action claro. Emojis são bem-vindos.
6.  **Twitter:** Legenda muito curta e direta (respeitando o limite de caracteres), com 1 a 2 hashtags principais e talvez um link (use um placeholder como [link]).
7.  Retorne a resposta estritamente como um objeto JSON, sem nenhum texto ou formatação adicional.

**Detalhes do Produto:**
- **Nome:** ${details.productName || 'Não especificado'}
- **Preço:** ${details.price ? `R$ ${details.price}` : 'Não especificado'}
- **Público-alvo:** ${details.targetAudience || 'Não especificado'}
- **Promoção/Destaque:** ${details.promotion || 'Não especificado'}
- **Estilo da Arte:** ${details.style || 'Não especificado'}
  `.trim();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [...imageParts, { text: prompt }] },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                instagram: { type: Type.STRING, description: 'Legenda para Instagram' },
                facebook: { type: Type.STRING, description: 'Legenda para Facebook' },
                twitter: { type: Type.STRING, description: 'Legenda para Twitter' },
            },
            required: ['instagram', 'facebook', 'twitter'],
        },
    },
  });

  const jsonText = response.text.trim();
  
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse JSON response for text posts:", jsonText);
    throw new Error("A resposta de texto da IA não estava no formato esperado.");
  }
};

const generateVisualPost = async (imageParts: Part[], logoPart: Part | null, details: ProductDetails): Promise<string | null> => {
    let typographySection = '';
    if (details.productName || details.promotion || details.price) {
        let typographyInstructions = '';
        if (details.productName) {
            typographyInstructions += `\n    - **Texto Principal:** "${details.productName}"`;
        }
        if (details.price) {
            typographyInstructions += `\n    - **Preço:** "R$ ${details.price}" - Dê destaque ao preço, mas sem sobrecarregar a arte.`;
        }
        if (details.promotion) {
            typographyInstructions += `\n    - **Texto Secundário:** "${details.promotion}"`;
        }

        typographySection = `
- **Tipografia:** Integre os seguintes textos na arte de forma harmoniosa com o estilo "${details.style}":${typographyInstructions}
  - **Posicionamento:** NUNCA, em nenhuma circunstância, posicione o texto sobre o produto. O produto deve estar 100% visível e sem obstruções. Posicione os textos em espaços vazios da composição.
  - **Legibilidade:** Use fontes e cores que garantam uma excelente leitura e contraste.`;
    }
  
    let logoInstruction = '';
    const allParts = [...imageParts];

    if (logoPart) {
        allParts.push(logoPart);
        logoInstruction = `- **Aplicação da Logo:** A ÚLTIMA imagem fornecida é a logo da marca. Incorpore esta logo na composição.
  - **Posicionamento:** Coloque-a em um dos cantos, de forma sutil e **NUNCA sobre o produto**.
  - **Integridade:** NÃO altere a logo (cores, forma, etc.).`;
    }


    const prompt = `
**Tarefa:** Atue como um diretor de arte. Crie uma arte promocional para um post de rede social (formato quadrado 1:1) com base nas imagens e informações fornecidas.

**Análise de Ativos:**
*   As primeiras imagens são os **produtos**.
*   Se houver uma última imagem adicional, ela é a **logo da marca**.

**Diretrizes Criativas:**

1.  **Isolamento do Produto:** Isole o produto principal de seu fundo original de forma limpa e profissional.

2.  **Cenário e Composição (Formato Quadrado 1:1):**
    *   Crie um cenário de fundo que corresponda ao estilo criativo: **"${details.style}"**. O fundo deve ser gráfico e complementar ao produto, não uma foto de um local real.
    *   Posicione o produto isolado no cenário de forma a criar uma composição equilibrada e atraente. O produto deve ser o ponto focal.

3.  **Elementos Adicionais:**
    ${typographySection}
    ${logoInstruction}

4.  **Qualidade Final:** O resultado deve ser uma imagem de alta qualidade, limpa e profissional. Não adicione nenhum outro logo, marca d'água ou texto aleatório.
`.trim();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [...allParts, { text: prompt }] },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });
      
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }
    return null;

  } catch (e) {
    console.error("Failed to generate visual post:", e);
    // Retorna nulo em caso de erro para não quebrar a aplicação
    return null;
  }
};

export const generateAllPosts = async (imageParts: Part[], logoPart: Part | null, details: ProductDetails): Promise<GeneratedPosts> => {
  try {
    const [textResult, visualPostUrl] = await Promise.all([
      generateCaptions(imageParts, details),
      generateVisualPost(imageParts, logoPart, details),
    ]);

    if (!textResult.instagram || !textResult.facebook || !textResult.twitter) {
      throw new Error("JSON response for text is missing required fields.");
    }

    return {
      instagram: textResult.instagram,
      facebook: textResult.facebook,
      twitter: textResult.twitter,
      visualPostUrl,
    };

  } catch (e) {
     console.error("Failed to generate posts:", e);
     throw new Error("A resposta da IA não estava no formato esperado. Tente novamente.");
  }
};