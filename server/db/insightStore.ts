import fs from 'fs';
import path from 'path';
import type { AIProductInsight } from '../../src/types.ts';

export class InsightCollection {
  private filePath: string;
  private records: Map<string, AIProductInsight> = new Map();
  private initialized = false;

  constructor(storageDir = path.join(process.cwd(), 'data')) {
    this.filePath = path.join(storageDir, 'insights.json');
    this.init(storageDir);
  }

  private init(storageDir: string): void {
    try {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: AIProductInsight[] = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            this.records.set(item.id, item);
          }
        }
      }
      this.initialized = true;
    } catch (err) {
      console.warn('[InsightCollection] Error reading persistent insights:', err);
      this.initialized = true;
    }
  }

  private persist(): void {
    try {
      const items = Array.from(this.records.values());
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error('[InsightCollection] Failed to persist insights:', err);
    }
  }

  public getAll(): AIProductInsight[] {
    return Array.from(this.records.values())
      .map((item) => ({ ...item }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  public getById(id: string): AIProductInsight | null {
    const item = this.records.get(id);
    return item ? { ...item } : null;
  }

  public getByThemeOrArea(productArea: string): AIProductInsight[] {
    return this.getAll().filter((i) => i.productArea.toLowerCase() === productArea.toLowerCase());
  }

  public set(insight: AIProductInsight): void {
    this.records.set(insight.id, { ...insight });
    this.persist();
  }

  public setMany(insights: AIProductInsight[]): void {
    for (const item of insights) {
      this.records.set(item.id, { ...item });
    }
    this.persist();
  }

  public clear(): void {
    this.records.clear();
    this.persist();
  }

  public count(): number {
    return this.records.size;
  }
}

export const insightStore = new InsightCollection();
