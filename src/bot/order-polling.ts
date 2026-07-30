export function successorIntentId(
  intent: { replaced_by_intent_id?: string | null },
  currentIntentId: string,
): string | null {
  const replacement = intent.replaced_by_intent_id?.trim();
  return replacement && replacement !== currentIntentId ? replacement : null;
}

export function expectsDigitalDelivery(productLabel: string): boolean {
  return !productLabel.startsWith("Swap →");
}
