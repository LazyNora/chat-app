import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    'hate/threatening': boolean;
    harassment: boolean;
    'harassment/threatening': boolean;
    'self-harm': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  categoryScores: Record<string, number>;
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    const moderation = await openai.moderations.create({
      input: text,
    });

    const result = moderation.results[0];

    return {
      flagged: result.flagged,
      categories: result.categories as any,
      categoryScores: result.category_scores as any,
    };
  } catch (error) {
    console.error('Error moderating content:', error);
    throw error;
  }
}

export default openai;

