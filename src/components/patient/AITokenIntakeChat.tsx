import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createCohereAIChatService, type ExtractedPatientData, CohereAIChatService } from '@/services/cohereAIService';
import { Loader2, Send } from 'lucide-react';

function tryParseJsonFromText(text: string): Partial<ExtractedPatientData> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') return obj as Partial<ExtractedPatientData>;
  } catch {
    const brace = text.match(/\{[\s\S]*\}/);
    if (brace) {
      try {
        const obj = JSON.parse(brace[0]);
        if (obj && typeof obj === 'object') return obj as Partial<ExtractedPatientData>;
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

function buildIntakeFromChat(service: AIChatService): {
  chief_complaint: string;
  symptoms: string[];
  extracted: Record<string, unknown>;
} {
  const lastAssistant = [...service.getHistory()].reverse().find((m) => m.role === 'assistant');
  const fromJson = lastAssistant ? tryParseJsonFromText(lastAssistant.content) : null;
  const heuristic = service.extractPatientData();

  const chief =
    (typeof fromJson?.chief_complaint === 'string' && fromJson.chief_complaint.trim()) ||
    (heuristic.chief_complaint?.trim() || '') ||
    'AI-assisted consultation';

  const symptoms =
    Array.isArray(fromJson?.symptoms) && fromJson.symptoms.length > 0
      ? (fromJson.symptoms as string[]).map((s) => String(s).trim()).filter(Boolean)
      : heuristic.symptoms || [];

  const extracted: Record<string, unknown> = {
    ...heuristic,
    ...(fromJson || {}),
    chief_complaint: chief,
    symptoms,
    source: 'ai_token_intake',
    generated_at: new Date().toISOString(),
  };

  return { chief_complaint: chief, symptoms, extracted };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  createToken: (payload: { chiefComplaint: string; symptoms: string[]; visitType: string }) => Promise<string>;
  onComplete: (tokenNumber: string) => void;
  onError: (message: string) => void;
};

export function AITokenIntakeChat({
  open,
  onOpenChange,
  patientId,
  createToken,
  onComplete,
  onError,
}: Props) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const serviceRef = useRef<AIChatService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (open) {
      serviceRef.current = createAIChatService(undefined, 'en');
      setInput('');
      bump();
    } else {
      serviceRef.current = null;
    }
  }, [open]);

  const messages = serviceRef.current?.getHistory() ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !serviceRef.current) return;
    setSending(true);
    try {
      await serviceRef.current.sendMessage(text);
      setInput('');
      bump();
    } catch (e: any) {
      onError(e.message || 'Could not reach AI');
    } finally {
      setSending(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!serviceRef.current) return;
    setFinalizing(true);
    try {
      const { chief_complaint, symptoms, extracted } = buildIntakeFromChat(serviceRef.current);

      const { error: convError } = await supabase.from('ai_conversations').insert({
        session_id: serviceRef.current.getSessionId(),
        patient_id: patientId,
        messages: serviceRef.current.getHistory() as unknown as Record<string, unknown>[],
        language: 'en',
        extracted_data: extracted,
        completed: true,
      });
      if (convError) throw convError;

      const tokenNumber = await createToken({
        chiefComplaint: chief_complaint,
        symptoms,
        visitType: 'AI Consultation',
      });

      onComplete(tokenNumber);
      onOpenChange(false);
    } catch (e: any) {
      onError(e.message || 'Failed to create token');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI visit intake</DialogTitle>
          <DialogDescription>
            Chat about your symptoms. We store the conversation and a structured JSON summary (chief complaint +
            symptoms), then create your queue token.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 min-h-[200px] max-h-[40vh] overflow-y-auto rounded-md border bg-muted/30 p-3 space-y-3 text-sm"
        >
          {messages.length === 0 && (
            <p className="text-muted-foreground">
              Example: “I have had fever and sore throat since yesterday.”
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === 'user'
                  ? 'ml-8 rounded-lg bg-primary/10 px-3 py-2'
                  : 'mr-8 rounded-lg bg-background border px-3 py-2 whitespace-pre-wrap'
              }
            >
              {m.content}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSend} disabled={sending || !input.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-2">Send</span>
            </Button>
            <Button type="button" onClick={handleGenerateToken} disabled={finalizing || sending}>
              {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className="ml-2">Generate token</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
