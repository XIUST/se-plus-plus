export function getSafeTopic(topic: string): string {
  let normalized = topic.trim().toUpperCase();
  
  const encoder = new TextEncoder();
  
  if (encoder.encode(normalized).length <= 64) {
    return normalized;
  }
  
  let truncated = normalized;
  while (encoder.encode(truncated).length > 64) {
    truncated = truncated.slice(0, -1);
  }
  
  return truncated;
}