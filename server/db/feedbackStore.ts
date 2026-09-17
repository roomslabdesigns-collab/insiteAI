import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Feedback, PaginatedFeedbackResult } from '../../src/types.ts';

// Initial sample feedback records (strictly 3 sample records for realistic verification)
const INITIAL_SAMPLE_RECORDS: Feedback[] = [
  {
    id: 'fb_sample_001',
    content: "We rebuild the same board-level report by hand every month because there's no scheduled automated export.",
    source: 'support_tickets',
    date: '2026-09-15T14:30:00.000Z',
    customerId: 'cust_ent_101',
    customerSegment: 'enterprise',
    plan: 'Enterprise Annual',
    revenue: 180000,
    productArea: 'reporting',
    sentiment: 'negative',
    severity: 'high',
    churnStatus: 'active',
    createdAt: '2026-09-15T14:32:10.000Z',
  },
  {
    id: 'fb_sample_002',
    content: 'Our enterprise security review stalled because project-level role scoping is not available yet.',
    source: 'support_tickets',
    date: '2026-09-16T09:15:00.000Z',
    customerId: 'cust_ent_102',
    customerSegment: 'enterprise',
    plan: 'Enterprise Custom',
    revenue: 310000,
    productArea: 'permissions',
    sentiment: 'negative',
    severity: 'critical',
    churnStatus: 'at_risk',
    createdAt: '2026-09-16T09:16:45.000Z',
  },
  {
    id: 'fb_sample_003',
    content: 'The new workspace AI summary digests save our product team at least four hours each sprint.',
    source: 'nps_feedback',
    date: '2026-09-16T17:45:00.000Z',
    customerId: 'cust_smb_204',
    customerSegment: 'smb',
    plan: 'Team Pro',
    revenue: 24000,
    productArea: 'ai_insights',
    sentiment: 'positive',
    severity: 'low',
    churnStatus: 'active',
    createdAt: '2026-09-16T17:46:00.000Z',
  },
];

export class FeedbackCollection {
  private filePath: string;
  private records: Map<string, Feedback> = new Map();
  private initialized = false;

  constructor(storageDir = path.join(process.cwd(), 'data')) {
    this.filePath = path.join(storageDir, 'feedback.json');
    this.init(storageDir);
  }

  private init(storageDir: string): void {
    try {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: Feedback[] = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            this.records.set(item.id, item);
          }
          this.initialized = true;
          return;
        }
      }

      // Initialize with sample records if file does not exist or is empty
      for (const sample of INITIAL_SAMPLE_RECORDS) {
        this.records.set(sample.id, { ...sample });
      }
      this.persist();
      this.initialized = true;
    } catch (err) {
      console.warn('[FeedbackCollection] Falling back to in-memory store:', err);
      for (const sample of INITIAL_SAMPLE_RECORDS) {
        this.records.set(sample.id, { ...sample });
      }
      this.initialized = true;
    }
  }

  private persist(): void {
    try {
      const items = Array.from(this.records.values());
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error('[FeedbackCollection] Failed to persist feedback collection:', err);
    }
  }

  public getAll(page = 1, limit = 10): PaginatedFeedbackResult {
    const safePage = Math.max(1, Number.isInteger(page) ? page : 1);
    const safeLimit = Math.max(1, Math.min(100, Number.isInteger(limit) ? limit : 10));

    // Sort descending by date / createdAt
    const allItems = Array.from(this.records.values()).sort((a, b) => {
      const timeA = new Date(b.date || b.createdAt).getTime();
      const timeB = new Date(a.date || a.createdAt).getTime();
      return timeA - timeB;
    });

    const total = allItems.length;
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const offset = (safePage - 1) * safeLimit;
    const items = allItems.slice(offset, offset + safeLimit);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    };
  }

  public getById(id: string): Feedback | null {
    const item = this.records.get(id);
    return item ? { ...item } : null;
  }

  public create(input: {
    content: string;
    source: string;
    date: string;
    customerId?: string | null;
    customerSegment?: string | null;
    plan?: string | null;
    revenue?: number | null;
    productArea?: string | null;
    sentiment?: string | null;
    severity?: string | null;
    churnStatus?: string | null;
    id?: string;
    createdAt?: string;
  }): Feedback {
    const id = input.id || `fb_${crypto.randomUUID()}`;
    const createdAt = input.createdAt || new Date().toISOString();

    const record: Feedback = {
      id,
      content: input.content,
      source: input.source,
      date: input.date,
      customerId: input.customerId ?? null,
      customerSegment: input.customerSegment ?? null,
      plan: input.plan ?? null,
      revenue: input.revenue !== undefined && input.revenue !== null ? Number(input.revenue) : null,
      productArea: input.productArea ?? null,
      sentiment: input.sentiment ?? null,
      severity: input.severity ?? null,
      churnStatus: input.churnStatus ?? null,
      createdAt,
    };

    this.records.set(id, record);
    this.persist();
    return { ...record };
  }

  public count(): number {
    return this.records.size;
  }

  public getAllRaw(): Feedback[] {
    return Array.from(this.records.values()).map((item) => ({ ...item }));
  }
}

// Singleton export
export const feedbackStore = new FeedbackCollection();
