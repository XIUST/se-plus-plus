# Topic Catalog Service

Purpose: Maintains a source of truth for study topic metadata in KV so the dashboard can list topics without scanning Vectorize.

Exports:
- `listTopics(kv)` returns the current topic catalog as `TopicSummary[]`.
- `recordTopicIngestion(kv, topic, sourceId, chunkCount)` updates a topic entry after ingestion.
- `removeTopic(kv, topic)` removes a topic entry from the catalog.

Rules:
- Store the catalog under a single KV key (`topics`) as JSON.
- Keep source IDs as a deduplicated array for `sourceCount`.
- Use ISO date strings for `lastIngestedAt`.
- This catalog is updated synchronously with the HTTP response; Vectorize inserts remain asynchronous.
