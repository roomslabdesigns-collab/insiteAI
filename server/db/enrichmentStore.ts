import fs from 'fs';
import path from 'path';
import type { FeedbackEnrichment } from '../../src/types.ts';

export class EnrichmentCollection {
  private filePath: string;
  private records: Map<string, FeedbackEnrichment> = new Map();
  private feedbackIdIndex: Map<string, string> = new Map(); // feedbackId -> enrichmentId
  private initialized = false;

  constructor(storageDir = path.join(process.cwd(), 'data')) {
    this.filePath = path.join(storageDir, 'enrichments.json');
    this.init(storageDir);
  }

  private init(storageDir: string): void {
    try {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: FeedbackEnrichment[] = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            this.records.set(item.id, item);
            this.feedbackIdIndex.set(item.feedbackId, item.id);
          }
        }
      }
      this.initialized = true;
    } catch (err) {
      console.warn('[EnrichmentCollection] Error reading persistent enrichments:', err);
      this.initialized = true;
    }
  }

  private persist(): void {
    try {
      const items = Array.from(this.records.values());
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error('[EnrichmentCollection] Failed to persist enrichments:', err);
    }
  }

  public getById(id: string): FeedbackEnrichment | null {
    const item = this.records.get(id);
    return item ? { ...item } : null;
  }

  public getByFeedbackId(feedbackId: string): FeedbackEnrichment | null {
    const enrichmentId = this.feedbackIdIndex.get(feedbackId);
    if (!enrichmentId) return null;
    return this.getById(enrichmentId);
  }

  public has(feedbackId: string): boolean {
    return this.feedbackIdIndex.has(feedbackId);
  }

  public getAll(): FeedbackEnrichment[] {
    return Array.from(this.records.values()).map((item) => ({ ...item }));
  }

  public save(enrichment: FeedbackEnrichment): FeedbackEnrichment {
    this.records.set(enrichment.id, { ...enrichment });
    this.feedbackIdIndex.set(enrichment.feedbackId, enrichment.id);
    this.persist();
    return { ...enrichment };
  }

  public count(): number {
    return this.records.size;
  }

  public getStats(): { totalEnriched: number; enrichedFeedbackIds: string[] } {
    return {
      totalEnriched: this.records.size,
      enrichedFeedbackIds: Array.from(this.feedbackIdIndex.keys()),
    };
  }
}

export const enrichmentStore = new EnrichmentCollection();
