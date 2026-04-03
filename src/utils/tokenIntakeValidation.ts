import type { CohereAIChatService } from '@/services/cohereAIService';

const TRIVIAL = /^(hi|hello|hey|ok|okay|yes|no|thanks|thank you|bye|good morning|gm)\.?$/i;

function isSubstantiveUserText(text: string): boolean {
  const t = text.trim();
  if (t.length < 12) return false;
  if (TRIVIAL.test(t)) return false;
  return true;
}

/**
 * Human-readable chief complaint for display and token row.
 */
export function buildDisplayChiefComplaint(service: CohereAIChatService): string {
  const extracted = service.extractPatientData();
  const chief = extracted.chief_complaint?.trim();
  if (chief && chief.length >= 10 && !TRIVIAL.test(chief)) {
    return chief;
  }

  const users = service.getHistory().filter((m) => m.role === 'user');
  const substantive = users.filter((m) => isSubstantiveUserText(m.content));
  if (substantive.length > 0) {
    const last = substantive[substantive.length - 1];
    return last.content.trim();
  }

  const lastUser = users[users.length - 1];
  return lastUser?.content.trim() || '';
}

export function validateIntakeForToken(service: CohereAIChatService): { ok: boolean; message?: string } {
  const users = service.getHistory().filter((m) => m.role === 'user');
  if (users.length === 0) {
    return { ok: false, message: 'Tell the assistant why you are visiting today.' };
  }

  const hasSubstantiveTurn = users.some((m) => isSubstantiveUserText(m.content));
  if (!hasSubstantiveTurn) {
    return {
      ok: false,
      message: 'Please describe your symptoms or concern in more detail (a short greeting is not enough).',
    };
  }

  const extracted = service.extractPatientData();
  const hasSymptoms = (extracted.symptoms?.length ?? 0) > 0;
  const displayChief = buildDisplayChiefComplaint(service);
  const chiefStrong = displayChief.length >= 18 && !TRIVIAL.test(displayChief);
  const longFreeText = users.some((m) => m.content.trim().length >= 35);

  if (!hasSymptoms && !chiefStrong && !longFreeText) {
    return {
      ok: false,
      message: 'Please add a bit more about symptoms, duration, or severity before generating a token.',
    };
  }

  return { ok: true };
}
