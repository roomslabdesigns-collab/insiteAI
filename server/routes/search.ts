import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { feedbackStore } from '../db/feedbackStore.ts';
import { enrichmentStore } from '../db/enrichmentStore.ts';
import { embeddingStore } from '../db/embeddingStore.ts';
import { generateEmbeddingVector } from '../services/embeddingService.ts';
import { AppError } from '../middleware/errorHandler.ts';
import type { SemanticSearchResult } from '../../src/types.ts';

const searchRouter = Router();

/**
 * POST /api/search
 * Semantic vector search over feedback signals
 * Input: { query: string, limit?: number, minSimilarity?: number }
 */
searchRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {};

    // 1. Validate query input
    if (
      body.query === undefined ||
      body.query === null ||
      typeof body.query !== 'string' ||
      body.query.trim().length === 0
    ) {
      throw new AppError(
        "Field 'query' is required and must be a non-empty string",
        400,
        'VALIDATION_ERROR',
        { field: 'query' }
      );
    }

    const query = body.query.trim();
    const limit = Math.max(1, Math.min(50, Number(body.limit) || 10));
    const minSimilarity = body.minSimilarity !== undefined ? Number(body.minSimilarity) : -1;

    // Check if any embeddings exist in the store
    if (embeddingStore.count() === 0) {
      return res.status(200).json({
        success: true,
        data: {
          query,
          totalMatches: 0,
          results: [],
          message: 'No feedback embeddings available yet in the database.',
        },
      });
    }

    // 2. Generate vector embedding for the search query using Gemini embedding model
    let queryVector: number[];
    try {
      queryVector = await generateEmbeddingVector(query);
    } catch (err) {
      console.error('[Search] Failed to embed search query:', err);
      throw new AppError(
        `Failed to generate search embedding: ${err instanceof Error ? err.message : 'Embedding error'}`,
        502,
        'EMBEDDING_FAILED'
      );
    }

    // 3. Search vector store using exact cosine similarity
    const vectorMatches = embeddingStore.search(queryVector, limit, minSimilarity);

    // 4. Hydrate matched vectors with feedback content and enriched metadata
    const results: SemanticSearchResult[] = [];

    for (const match of vectorMatches) {
      const feedback = feedbackStore.getById(match.feedbackId);
      if (!feedback) continue;

      const enrichment = enrichmentStore.getByFeedbackId(match.feedbackId);

      results.push({
        feedbackId: match.feedbackId,
        content: feedback.content,
        similarity: match.similarity,
        similarityScore: match.similarity,
        productArea: enrichment?.productArea || feedback.productArea || null,
        sentiment: enrichment?.sentiment || feedback.sentiment || null,
        severity: enrichment?.severity || feedback.severity || null,
        theme: enrichment?.theme || null,
        feedbackType: enrichment?.feedbackType || null,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        query,
        totalMatches: results.length,
        results,
      },
    });
  } catch (err) {
    next(err);
  }
});

export { searchRouter };
