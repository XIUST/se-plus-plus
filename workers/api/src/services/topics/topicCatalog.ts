import type { TopicSummary } from "@se-plus/shared";

const TOPICS_CATALOG_KEY = "topics";

type Catalog = Record<string, TopicCatalogEntry>;

type TopicCatalogEntry = {
  topic: string;
  sourceIds: string[];
  chunkCount: number;
  /** True while the topic's latest vectors are still being made searchable. */
  indexing?: boolean;
  lastIngestedAt: string;
};

export async function listTopics(kv: KVNamespace): Promise<TopicSummary[]> {
  const catalog = await readCatalog(kv);
  const topics = Object.values(catalog).map((entry) => ({
    topic: entry.topic,
    sourceCount: entry.sourceIds.length,
    chunkCount: entry.chunkCount,
    lastIngestedAt: entry.lastIngestedAt,
  }));

  topics.sort((a, b) => (b.lastIngestedAt > a.lastIngestedAt ? 1 : -1));
  return topics;
}

export async function recordTopicIngestion(
  kv: KVNamespace,
  topic: string,
  sourceId: string,
  chunkCount: number,
): Promise<void> {
  const catalog = await readCatalog(kv);
  const existing = catalog[topic];

  const sourceIds = new Set(existing?.sourceIds ?? []);
  sourceIds.add(sourceId);

  catalog[topic] = {
    topic,
    sourceIds: Array.from(sourceIds),
    chunkCount: (existing?.chunkCount ?? 0) + chunkCount,
    indexing: true,
    lastIngestedAt: new Date().toISOString(),
  };

  await writeCatalog(kv, catalog);
}

export async function markTopicReady(kv: KVNamespace, topic: string): Promise<void> {
  const catalog = await readCatalog(kv);
  const existing = catalog[topic];
  if (!existing) return;

  catalog[topic] = {
    ...existing,
    indexing: false,
  };

  await writeCatalog(kv, catalog);
}

export async function removeTopic(kv: KVNamespace, topic: string): Promise<void> {
  const catalog = await readCatalog(kv);
  delete catalog[topic];
  await writeCatalog(kv, catalog);
}

async function readCatalog(kv: KVNamespace): Promise<Catalog> {
  const raw = await kv.get(TOPICS_CATALOG_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Catalog;
    return isCatalog(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function writeCatalog(kv: KVNamespace, catalog: Catalog): Promise<void> {
  await kv.put(TOPICS_CATALOG_KEY, JSON.stringify(catalog));
}

function isCatalog(value: unknown): value is Catalog {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
