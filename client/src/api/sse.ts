import { API_BASE } from './auth';

export interface SseHandlers {
  onKafkaPublished?: (data: string) => void;
  onSkillsExtracted?: (data: string) => void;
  onRagRetrieved?: (data: string) => void;
  onPlanGenerated: (prepPlanId: string) => void;
  onError: () => void;
}

export function openSseConnection(analysisId: string, handlers: SseHandlers): () => void {
  const es = new EventSource(`${API_BASE}/api/events/${analysisId}`);

  es.addEventListener('kafka_published', (event) => {
    handlers.onKafkaPublished?.((event as MessageEvent<string>).data);
  });

  es.addEventListener('skills_extracted', (event) => {
    handlers.onSkillsExtracted?.((event as MessageEvent<string>).data);
  });

  es.addEventListener('rag_retrieved', (event) => {
    handlers.onRagRetrieved?.((event as MessageEvent<string>).data);
  });

  es.addEventListener('plan_generated', (event) => {
    handlers.onPlanGenerated((event as MessageEvent<string>).data);
  });

  es.onerror = () => {
    handlers.onError();
  };

  return () => {
    es.close();
  };
}
