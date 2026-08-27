export function openSseConnection(
  analysisId: string,
  onPlanGenerated: (prepPlanId: string) => void,
  onError: () => void
): () => void {
  const es = new EventSource(`/api/events/${analysisId}`);

  es.addEventListener('plan_generated', (event) => {
    onPlanGenerated((event as MessageEvent<string>).data);
  });

  es.onerror = () => {
    onError();
  };

  return () => {
    es.close();
  };
}
