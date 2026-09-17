import fs from 'fs';
import path from 'path';
import type { FeedbackEmbedding } from '../../src/types.ts';

/**
 * Calculates cosine similarity between two numeric vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized text embeddings).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class EmbeddingCollection {
  private filePath: string;
  private records: Map<string, FeedbackEmbedding> = new Map(); // feedbackId -> FeedbackEmbedding
  private initialized = false;

  constructor(storageDir = path.join(process.cwd(), 'data')) {
    this.filePath = path.join(storageDir, 'embeddings.json');
    this.init(storageDir);
  }

  private init(storageDir: string): void {
    try {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: FeedbackEmbedding[] = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.feedbackId && Array.isArray(item.embedding)) {
              this.records.set(item.feedbackId, item);
            }
          }
        }
      }
      this.initialized = true;
    } catch (err) {
      console.warn('[EmbeddingCollection] Error loading persistent embeddings:', err);
      this.initialized = true;
    }
  }

  private persist(): void {
    try {
      const items = Array.from(this.records.values());
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error('[EmbeddingCollection] Failed to persist embeddings:', err);
    }
  }

  public get(feedbackId: string): FeedbackEmbedding | null {
    const item = this.records.get(feedbackId);
    return item ? { ...item } : null;
  }

  public has(feedbackId: string): boolean {
    const item = this.records.get(feedbackId);
    return Boolean(item && Array.isArray(item.embedding) && item.embedding.length > 0);
  }

  public save(data: {
    feedbackId: string;
    embedding: number[];
    embeddingModel: string;
  }): FeedbackEmbedding {
    const now = new Date().toISOString();
    const existing = this.records.get(data.feedbackId);

    const record: FeedbackEmbedding = {
      feedbackId: data.feedbackId,
      embedding: data.embedding,
      embeddingModel: data.embeddingModel,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.records.set(data.feedbackId, record);
    this.persist();
    return { ...record };
  }

  public getAll(): FeedbackEmbedding[] {
    return Array.from(this.records.values()).map((item) => ({ ...item }));
  }

  public count(): number {
    return this.records.size;
  }

  /**
   * Performs in-memory exact cosine similarity search against all stored vectors.
   * Returns sorted matches descending by similarity score.
   */
  public search(
    queryVector: number[],
    topK = 10,
    minSimilarity = -1
  ): Array<{ feedbackId: string; similarity: number; embeddingModel: string }> {
    const matches: Array<{ feedbackId: string; similarity: number; embeddingModel: string }> = [];

    for (const [feedbackId, item] of this.records.entries()) {
      if (!item.embedding || item.embedding.length === 0) continue;
      const sim = cosineSimilarity(queryVector, item.embedding);
      if (sim >= minSimilarity) {
        matches.push({
          feedbackId,
          similarity: Number(sim.toFixed(4)),
          embeddingModel: item.embeddingModel,
        });
      }
    }

    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, topK);
  }

  public getStats(): { totalEmbeddings: number; embeddedFeedbackIds: string[] } {
    return {
      totalEmbeddings: this.records.size,
      embeddedFeedbackIds: Array.from(this.records.keys()),
    };
  }
}

export const embeddingStore = new EmbeddingCollection();
