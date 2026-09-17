import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { askAnalyst } from '../services/analystService.ts';
import { AppError } from '../middleware/errorHandler.ts';

const analystRouter = Router();

/**
 * POST /api/analyst/ask
 * Semantic RAG question answering endpoint.
 * Input: { question: string, limit?: number, minSimilarity?: number }
 * Output: { answer: string, evidence: Array<{ feedbackId, content, similarity, ... }> }
 */
analystRouter.post('/ask', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {};

    // 1. Validate question
    if (
      body.question === undefined ||
      body.question === null ||
      typeof body.question !== 'string' ||
      body.question.trim().length === 0
    ) {
      throw new AppError(
        "Field 'question' is required and must be a non-empty string",
        400,
        'VALIDATION_ERROR',
        { field: 'question' }
      );
    }

    const question = body.question.trim();
    const limit = body.limit !== undefined ? Number(body.limit) : undefined;
    const minSimilarity = body.minSimilarity !== undefined ? Number(body.minSimilarity) : undefined;

    const result = await askAnalyst({
      question,
      limit,
      minSimilarity,
    });

    res.status(200).json({
      success: true,
      data: result,
      answer: result.answer,
      evidence: result.evidence,
    });
  } catch (err) {
    next(err);
  }
});

export { analystRouter };
