import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { feedbackStore } from '../db/feedbackStore.ts';
import { enrichmentStore } from '../db/enrichmentStore.ts';
import { embeddingStore } from '../db/embeddingStore.ts';
import { enrichFeedbackRecord } from '../services/enrichmentService.ts';
import { embedFeedbackRecord } from '../services/embeddingService.ts';
import { AppError } from '../middleware/errorHandler.ts';
import type { FeedbackEnrichment } from '../../src/types.ts';

const feedbackRouter = Router();

/**
 * Validates feedback creation payload
 */
function validateFeedbackInput(body: Record<string, unknown>) {
  // 1. content is required
  if (
    body.content === undefined ||
    body.content === null ||
    typeof body.content !== 'string' ||
    body.content.trim().length === 0
  ) {
    throw new AppError(
      "Field 'content' is required and must be a non-empty string",
      400,
      'VALIDATION_ERROR',
      { field: 'content' }
    );
  }

  // 2. source is required
  if (
    body.source === undefined ||
    body.source === null ||
    typeof body.source !== 'string' ||
    body.source.trim().length === 0
  ) {
    throw new AppError(
      "Field 'source' is required and must be a non-empty string",
      400,
      'VALIDATION_ERROR',
      { field: 'source' }
    );
  }

  // 3. date is valid
  if (
    body.date === undefined ||
    body.date === null ||
    (typeof body.date !== 'string' && typeof body.date !== 'number') ||
    isNaN(new Date(body.date as string | number).getTime())
  ) {
    throw new AppError(
      "Field 'date' is required and must be a valid date",
      400,
      'VALIDATION_ERROR',
      { field: 'date' }
    );
  }

  // 4. revenue is numeric when provided
  if (body.revenue !== undefined && body.revenue !== null) {
    if (typeof body.revenue === 'boolean') {
      throw new AppError(
        "Field 'revenue' must be numeric when provided",
        400,
        'VALIDATION_ERROR',
        { field: 'revenue' }
      );
    }
    const num = Number(body.revenue);
    if (!Number.isFinite(num) || isNaN(num)) {
      throw new AppError(
        "Field 'revenue' must be numeric when provided",
        400,
        'VALIDATION_ERROR',
        { field: 'revenue' }
      );
    }
  }
}

/**
 * GET /api/feedback
 * Supports pagination via ?page=1&limit=10
 */
feedbackRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    let page = 1;
    let limit = 10;

    if (req.query.page !== undefined) {
      const parsedPage = Number(req.query.page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        throw new AppError("Query parameter 'page' must be a positive integer", 400, 'VALIDATION_ERROR', {
          query: 'page',
        });
      }
      page = parsedPage;
    }

    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        throw new AppError("Query parameter 'limit' must be a positive integer", 400, 'VALIDATION_ERROR', {
          query: 'limit',
        });
      }
      limit = Math.min(100, parsedLimit);
    }

    const result = feedbackStore.getAll(page, limit);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/feedback/enrichment/stats
 * Overview of enrichment coverage across stored feedback
 */
feedbackRouter.get('/enrichment/stats', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalFeedback = feedbackStore.count();
    const stats = enrichmentStore.getStats();
    res.status(200).json({
      success: true,
      data: {
        totalFeedback,
        totalEnriched: stats.totalEnriched,
        pendingEnrichment: Math.max(0, totalFeedback - stats.totalEnriched),
        enrichedFeedbackIds: stats.enrichedFeedbackIds,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/feedback/enrich
 * Batch feedback enrichment endpoint. Processes a limited batch at a time.
 * Avoids re-processing already enriched feedback unless `force === true`.
 */
feedbackRouter.post('/enrich', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {};
    const limit = Math.max(1, Math.min(20, Number(body.limit) || 5));
    const force = Boolean(body.force);
    const feedbackIds: string[] | undefined = Array.isArray(body.feedbackIds) ? body.feedbackIds : undefined;

    // Retrieve feedback records to inspect
    let candidates = feedbackIds
      ? feedbackIds
          .map((id) => feedbackStore.getById(id))
          .filter((f): f is NonNullable<typeof f> => f !== null)
      : feedbackStore.getAll(1, 100).items;

    let skipped = 0;
    if (!force) {
      const initialCount = candidates.length;
      candidates = candidates.filter((item) => !enrichmentStore.has(item.id));
      skipped = initialCount - candidates.length;
    }

    // Limit the batch size
    const batchToProcess = candidates.slice(0, limit);

    const results: FeedbackEnrichment[] = [];
    const failures: Array<{ feedbackId: string; error: string }> = [];

    for (const record of batchToProcess) {
      try {
        // Enriches record using Gemini 3.8 Flash without mutating the original feedback content
        const enrichment = await enrichFeedbackRecord(record);
        const saved = enrichmentStore.save(enrichment);
        results.push(saved);
      } catch (err) {
        console.error(`[Enrichment] Failed to enrich feedback ${record.id}:`, err);
        failures.push({
          feedbackId: record.id,
          error: err instanceof Error ? err.message : 'Unknown classification error',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        processed: batchToProcess.length,
        successful: results.length,
        failed: failures.length,
        skipped,
        results,
        failures,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/feedback/embedding/stats
 * Overview of embedding coverage across stored feedback
 */
feedbackRouter.get('/embedding/stats', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalFeedback = feedbackStore.count();
    const stats = embeddingStore.getStats();
    res.status(200).json({
      success: true,
      data: {
        totalFeedback,
        totalEmbedded: stats.totalEmbeddings,
        pendingEmbedding: Math.max(0, totalFeedback - stats.totalEmbeddings),
        embeddedFeedbackIds: stats.embeddedFeedbackIds,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/feedback/embed
 * Batch embedding generation endpoint. Processes a limited number of records per request.
 * Avoids regenerating embeddings when a valid embedding already exists (unless force: true).
 */
feedbackRouter.post('/embed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {};
    const limit = Math.max(1, Math.min(20, Number(body.limit) || 5));
    const force = Boolean(body.force);
    const feedbackIds: string[] | undefined = Array.isArray(body.feedbackIds) ? body.feedbackIds : undefined;

    // Retrieve feedback records to inspect
    let candidates = feedbackIds
      ? feedbackIds
          .map((id) => feedbackStore.getById(id))
          .filter((f): f is NonNullable<typeof f> => f !== null)
      : feedbackStore.getAll(1, 100).items;

    let skipped = 0;
    if (!force) {
      const initialCount = candidates.length;
      candidates = candidates.filter((item) => !embeddingStore.has(item.id));
      skipped = initialCount - candidates.length;
    }

    const batchToProcess = candidates.slice(0, limit);

    const results: Array<{
      feedbackId: string;
      embeddingModel: string;
      dimensions: number;
    }> = [];
    const failures: Array<{ feedbackId: string; error: string }> = [];

    for (const record of batchToProcess) {
      try {
        const enrichment = enrichmentStore.getByFeedbackId(record.id);
        const embedded = await embedFeedbackRecord(record, enrichment);
        const saved = embeddingStore.save(embedded);
        results.push({
          feedbackId: saved.feedbackId,
          embeddingModel: saved.embeddingModel,
          dimensions: saved.embedding.length,
        });
      } catch (err) {
        console.error(`[Embedding] Failed to generate embedding for ${record.id}:`, err);
        failures.push({
          feedbackId: record.id,
          error: err instanceof Error ? err.message : 'Embedding generation failed',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        processed: batchToProcess.length,
        successful: results.length,
        failed: failures.length,
        skipped,
        results,
        failures,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/feedback
 * Create a new feedback record
 */
feedbackRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {};
    validateFeedbackInput(body);

    const dateIso = new Date(body.date).toISOString();
    const revenue =
      body.revenue !== undefined && body.revenue !== null ? Number(body.revenue) : null;

    const newFeedback = feedbackStore.create({
      content: (body.content as string).trim(),
      source: (body.source as string).trim(),
      date: dateIso,
      customerId: body.customerId ? String(body.customerId).trim() : null,
      customerSegment: body.customerSegment ? String(body.customerSegment).trim() : null,
      plan: body.plan ? String(body.plan).trim() : null,
      revenue,
      productArea: body.productArea ? String(body.productArea).trim() : null,
      sentiment: body.sentiment ? String(body.sentiment).trim() : null,
      severity: body.severity ? String(body.severity).trim() : null,
      churnStatus: body.churnStatus ? String(body.churnStatus).trim() : null,
    });

    res.status(201).json({
      success: true,
      data: newFeedback,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/feedback/:id/enrich
 * Retrieve enrichment details for a specific feedback record
 */
feedbackRouter.get('/:id/enrich', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const enrichment = enrichmentStore.getByFeedbackId(id);

    if (!enrichment) {
      throw new AppError(`No enrichment record found for feedback ID '${id}'`, 404, 'NOT_FOUND', { feedbackId: id });
    }

    res.status(200).json({
      success: true,
      data: enrichment,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/feedback/:id/enrich
 * Enrich a single feedback record by id
 */
feedbackRouter.post('/:id/enrich', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const force = Boolean(req.body?.force || req.query.force === 'true');

    const feedback = feedbackStore.getById(id);
    if (!feedback) {
      throw new AppError(`Feedback record with ID '${id}' not found`, 404, 'NOT_FOUND', { id });
    }

    // Check if already enriched and force is not specified
    if (!force && enrichmentStore.has(id)) {
      const existing = enrichmentStore.getByFeedbackId(id);
      return res.status(200).json({
        success: true,
        data: existing,
        alreadyEnriched: true,
      });
    }

    try {
      const enrichment = await enrichFeedbackRecord(feedback);
      const saved = enrichmentStore.save(enrichment);
      return res.status(200).json({
        success: true,
        data: saved,
      });
    } catch (err) {
      console.error(`[Enrichment] Failed to classify feedback '${id}':`, err);
      throw new AppError(
        `Failed to enrich feedback: ${err instanceof Error ? err.message : 'AI classification failed'}`,
        502,
        'ENRICHMENT_FAILED',
        { feedbackId: id }
      );
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/feedback/:id/embed
 * Retrieve embedding record for a specific feedback record
 */
feedbackRouter.get('/:id/embed', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const embedding = embeddingStore.get(id);

    if (!embedding) {
      throw new AppError(`No embedding record found for feedback ID '${id}'`, 404, 'NOT_FOUND', { feedbackId: id });
    }

    res.status(200).json({
      success: true,
      data: {
        feedbackId: embedding.feedbackId,
        embeddingModel: embedding.embeddingModel,
        dimensions: embedding.embedding.length,
        createdAt: embedding.createdAt,
        updatedAt: embedding.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/feedback/:id/embed
 * Generate embedding for a single feedback record by id
 */
feedbackRouter.post('/:id/embed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const force = Boolean(req.body?.force || req.query.force === 'true');

    const feedback = feedbackStore.getById(id);
    if (!feedback) {
      throw new AppError(`Feedback record with ID '${id}' not found`, 404, 'NOT_FOUND', { id });
    }

    // Check if already embedded and force is not specified
    if (!force && embeddingStore.has(id)) {
      const existing = embeddingStore.get(id)!;
      return res.status(200).json({
        success: true,
        data: {
          feedbackId: existing.feedbackId,
          embeddingModel: existing.embeddingModel,
          dimensions: existing.embedding.length,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        },
        alreadyEmbedded: true,
      });
    }

    try {
      const enrichment = enrichmentStore.getByFeedbackId(id);
      const embedded = await embedFeedbackRecord(feedback, enrichment);
      const saved = embeddingStore.save(embedded);

      return res.status(200).json({
        success: true,
        data: {
          feedbackId: saved.feedbackId,
          embeddingModel: saved.embeddingModel,
          dimensions: saved.embedding.length,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt,
        },
      });
    } catch (err) {
      console.error(`[Embedding] Failed to generate embedding for '${id}':`, err);
      throw new AppError(
        `Failed to generate embedding: ${err instanceof Error ? err.message : 'Embedding failed'}`,
        502,
        'EMBEDDING_FAILED',
        { feedbackId: id }
      );
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/feedback/:id
 * Retrieve a specific feedback record by id
 */
feedbackRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const record = feedbackStore.getById(id);

    if (!record) {
      throw new AppError(`Feedback record with ID '${id}' not found`, 404, 'NOT_FOUND', { id });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

export { feedbackRouter };
