# Topic Catalog Service

Purpose: Maintains a source of truth for study topic metadata in KV so the dashboard can list topics without scanning Vectorize.

Exports:
- `listTopics(kv)` returns the current topic catalog as `TopicSummary[]`.
- `recordTopicIngestion(kv, topic, sourceId, chunkCount)` updates a topic entry after ingestion, marking it as indexing.
- `markTopicReady(kv, topic)` clears the indexing flag once vectors are confirmed searchable.
- `removeTopic(kv, topic)` removes a topic entry from the catalog.

Rules:
- Store the catalog under a single KV key (`topics`) as JSON.
- Keep source IDs as a deduplicated array for `sourceCount`.
- Use ISO date strings for `lastIngestedAt`.
- Topic metadata is recorded immediately, but mark it as `indexing` until Vectorize confirms the vectors are searchable.
- The route waits for readiness before returning; if the wait exceeds the foreground timeout, it finishes via `ctx.waitUntil` and marks the topic ready later.
