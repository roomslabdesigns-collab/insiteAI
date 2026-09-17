import { GoogleGenAI, Type, type Schema } from '@google/genai';
import crypto from 'crypto';
import { getGeminiApiKey } from '../config.ts';
import type { Feedback, FeedbackEnrichment, FeedbackType } from '../../src/types.ts';

export const ENRICHMENT_MODEL_NAME = 'gemini-3.8-flash';

const enrichmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sentiment: {
      type: Type.STRING,
      enum: ['positive', 'neutral', 'negative', 'mixed'],
      description: 'Overall sentiment of the user feedback.',
    },
    severity: {
      type: Type.STRING,
      enum: ['critical', 'high', 'medium', 'low'],
      description: 'Urgency or business severity of the issue or feedback.',
    },
    productArea: {
      type: Type.STRING,
      description: 'Concise product area, e.g. reporting, permissions, onboarding, billing, performance, integrations, etc.',
    },
    feedbackType: {
      type: Type.STRING,
      enum: ['Bug', 'Feature Request', 'Complaint', 'Praise', 'Question', 'Other'],
      description: 'Primary feedback classification.',
    },
    theme: {
      type: Type.STRING,
      description: 'Short 2-4 word theme label describing the core topic or friction point.',
    },
    featureRequest: {
      type: Type.BOOLEAN,
      description: 'Whether the feedback is explicitly asking for a new feature or enhancement.',
    },
    churnSignal: {
      type: Type.BOOLEAN,
      description: 'Whether the customer expresses frustration indicating cancellation risk, churn, or blocked rollout.',
    },
  },
  required: [
    'sentiment',
    'severity',
    'productArea',
    'feedbackType',
    'theme',
    'featureRequest',
    'churnSignal',
  ],
};

let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = getGeminiApiKey();
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

/**
 * Classifies a single feedback record using Gemini 3.8 Flash.
 * Throws on failure — never fabricates fallback data.
 */
export async function classifyFeedbackWithLLM(feedback: Feedback): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  productArea: string;
  feedbackType: FeedbackType;
  theme: string;
  featureRequest: boolean;
  churnSignal: boolean;
}> {
  const ai = getAIClient();

  const prompt = `You are a product intelligence classifier analyzing customer feedback.
Analyze the following feedback signal carefully and extract structured classifications.

Feedback Content:
"${feedback.content}"

Metadata Context:
- Source: ${feedback.source}
- Customer Segment: ${feedback.customerSegment || 'Not specified'}
- Plan: ${feedback.plan || 'Not specified'}
- ARR / Revenue: ${feedback.revenue !== null && feedback.revenue !== undefined ? `$${feedback.revenue}` : 'Not specified'}
- Recorded Churn Status: ${feedback.churnStatus || 'Not specified'}

Instructions:
1. sentiment: Determine if sentiment is "positive", "neutral", "negative", or "mixed".
2. severity: Estimate business and user severity: "critical" (showstopper/blocker/churn risk), "high" (significant impediment), "medium" (inconvenience/friction), or "low" (minor feedback/praise).
3. productArea: Identify the specific product area (e.g., "reporting", "permissions", "onboarding", "billing", "navigation", "integrations", "ai_insights").
4. feedbackType: Must be exactly one of: "Bug", "Feature Request", "Complaint", "Praise", "Question", "Other".
5. theme: A concise 2-4 word theme label summarizing the topic (e.g., "Scheduled export gaps", "Project role permissions", "Bulk CSV onboarding").
6. featureRequest: Set true if the user suggests, requests, or asks for a new feature or functionality.
7. churnSignal: Set true if the user mentions cancelling, switching, leaving, blocked expansion, or dissatisfaction leading to potential churn.`;

  let responseText: string | undefined;
  let lastError: unknown;

  // Attempt generateContent with transient retry
  const modelsToTry = [ENRICHMENT_MODEL_NAME, 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: enrichmentSchema,
          temperature: 0.1,
        },
      });
      responseText = response.text;
      if (responseText) {
        break;
      }
    } catch (err: unknown) {
      lastError = err;
      const isTransient =
        err instanceof Error &&
        (err.message.includes('503') || err.message.includes('429') || err.message.includes('UNAVAILABLE'));
      if (isTransient) {
        // Pause briefly before next attempt
        await new Promise((res) => setTimeout(res, 1200));
        continue;
      }
      throw err;
    }
  }

  if (!responseText) {
    throw new Error(`LLM classification failed: ${lastError instanceof Error ? lastError.message : 'No response generated'}`);
  }

  const parsed = JSON.parse(responseText);

  // Validate presence of required attributes
  if (
    !parsed.sentiment ||
    !parsed.severity ||
    !parsed.productArea ||
    !parsed.feedbackType ||
    !parsed.theme ||
    parsed.featureRequest === undefined ||
    parsed.churnSignal === undefined
  ) {
    throw new Error('LLM response did not contain all required classification properties.');
  }

  return {
    sentiment: parsed.sentiment,
    severity: parsed.severity,
    productArea: String(parsed.productArea).trim().toLowerCase(),
    feedbackType: parsed.feedbackType as FeedbackType,
    theme: String(parsed.theme).trim(),
    featureRequest: Boolean(parsed.featureRequest),
    churnSignal: Boolean(parsed.churnSignal),
  };
}

/**
 * Creates a linked enrichment entity from LLM classification.
 */
export async function enrichFeedbackRecord(feedback: Feedback): Promise<FeedbackEnrichment> {
  const classification = await classifyFeedbackWithLLM(feedback);

  const enrichment: FeedbackEnrichment = {
    id: `enr_${crypto.randomUUID()}`,
    feedbackId: feedback.id,
    sentiment: classification.sentiment,
    severity: classification.severity,
    productArea: classification.productArea,
    feedbackType: classification.feedbackType,
    theme: classification.theme,
    featureRequest: classification.featureRequest,
    churnSignal: classification.churnSignal,
    model: ENRICHMENT_MODEL_NAME,
    processedAt: new Date().toISOString(),
  };

  return enrichment;
}
