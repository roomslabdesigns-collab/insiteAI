import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from '../config.ts';
import type { Feedback, FeedbackEnrichment, FeedbackEmbedding } from '../../src/types.ts';

export const EMBEDDING_MODEL_NAME = 'gemini-embedding-001';

let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = getGeminiApiKey();
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

/**
 * Generates an embedding vector for arbitrary text content using Gemini embeddings.
 * Retries with exponential backoff on transient errors (429, 503).
 */
export async function generateEmbeddingVector(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text content.');
  }

  const ai = getAIClient();
  const trimmed = text.trim();

  let lastError: unknown;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await ai.models.embedContent({
        model: EMBEDDING_MODEL_NAME,
        contents: trimmed,
      });

      // @google/genai returns embeddings array or embedding object depending on version
      let vector: number[] | undefined;
      if (res.embeddings && Array.isArray(res.embeddings) && res.embeddings.length > 0) {
        vector = res.embeddings[0].values;
      } else if ((res as { embedding?: { values?: number[] } }).embedding?.values) {
        vector = (res as { embedding?: { values?: number[] } }).embedding?.values;
      }

      if (!vector || !Array.isArray(vector) || vector.length === 0) {
        throw new Error('Embedding API returned empty vector representation.');
      }

      return vector;
    } catch (err: unknown) {
      lastError = err;
      const isTransient =
        err instanceof Error &&
        (err.message.includes('503') ||
          err.message.includes('429') ||
          err.message.includes('UNAVAILABLE') ||
          err.message.includes('RESOURCE_EXHAUSTED'));

      if (isTransient && attempt < maxAttempts) {
        const delay = attempt * 1200;
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      break;
    }
  }

  throw new Error(
    `Failed to generate embedding vector: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`
  );
}

/**
 * Builds the textual representation of feedback for embedding generation.
 * Combines customer signal content with enriched context when available.
 */
export function buildFeedbackEmbeddingText(
  feedback: Feedback,
  enrichment?: FeedbackEnrichment | null
): string {
  const parts: string[] = [feedback.content.trim()];

  if (enrichment) {
    if (enrichment.theme) {
      parts.push(`Theme: ${enrichment.theme}`);
    }
    if (enrichment.productArea) {
      parts.push(`Product Area: ${enrichment.productArea}`);
    }
    if (enrichment.feedbackType) {
      parts.push(`Type: ${enrichment.feedbackType}`);
    }
  }

  return parts.join('\n');
}

/**
 * Generates an embedding representation for a feedback record.
 */
export async function embedFeedbackRecord(
  feedback: Feedback,
  enrichment?: FeedbackEnrichment | null
): Promise<Omit<FeedbackEmbedding, 'createdAt' | 'updatedAt'>> {
  const textToEmbed = buildFeedbackEmbeddingText(feedback, enrichment);
  const vector = await generateEmbeddingVector(textToEmbed);

  return {
    feedbackId: feedback.id,
    embedding: vector,
    embeddingModel: EMBEDDING_MODEL_NAME,
  };
}
