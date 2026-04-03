/**
 * Normalizes chief complaint for queue cards and lists:
 * prefers structured symptoms, otherwise extracts known symptom words from messy text
 * (e.g. "4 day, dry, yes, worse, fever" → "Fever").
 */

const SYMPTOM_PHRASES = [
  'shortness of breath',
  'sore throat',
  'chest pain',
  'stomach pain',
  'body ache',
  'dry cough',
  'runny nose',
];

const SYMPTOM_WORDS = [
  'fever',
  'cough',
  'cold',
  'flu',
  'headache',
  'pain',
  'vomiting',
  'diarrhea',
  'weakness',
  'dizziness',
  'nausea',
  'fatigue',
  'chills',
  'rash',
];

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extract human-readable symptom labels from free text (questionnaire-style or chat).
 */
export function extractSymptomLabelsFromText(text: string): string[] {
  if (!text?.trim()) return [];
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const phrase of SYMPTOM_PHRASES) {
    if (new RegExp(phrase.replace(/\s+/g, '\\s+'), 'i').test(lower)) {
      found.add(capitalizeWords(phrase));
    }
  }
  for (const w of SYMPTOM_WORDS) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(text)) {
      found.add(capitalizeWords(w));
    }
  }

  return Array.from(found);
}

/**
 * Queue / dashboard display: short, clinical-style line.
 */
export function formatChiefComplaintForQueue(
  chief: string | null | undefined,
  symptoms?: string[] | null
): string {
  if (symptoms?.length) {
    return symptoms
      .slice(0, 4)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ');
  }

  const raw = (chief || '').trim();
  if (!raw) return '';

  const fromKeywords = extractSymptomLabelsFromText(raw);
  if (fromKeywords.length > 0) {
    return fromKeywords.slice(0, 4).join(', ');
  }

  const singleLine = raw.replace(/\s+/g, ' ');
  if (singleLine.length <= 48) return singleLine;
  return singleLine.slice(0, 45).trim() + '…';
}
