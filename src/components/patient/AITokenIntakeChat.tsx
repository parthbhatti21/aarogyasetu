import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCohereAIChatService, type CohereAIChatService } from '@/services/cohereAIService';
import { supabase } from '@/utils/supabase';
import {
  buildDisplayChiefComplaint,
  validateIntakeForToken,
} from '@/utils/tokenIntakeValidation';
import {
  DEFAULT_VOICE_SILENCE_MS,
  VOICE_LOCALES,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakText,
  startContinuousListeningWithSilence,
  stopSpeaking,
} from '@/utils/voiceAgent';
import { Loader2, Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';

function buildIntakeFromChat(service: CohereAIChatService): {
  chief_complaint: string;
  symptoms: string[];
  extracted: Record<string, unknown>;
} {
  const extracted = service.extractPatientData();
  const chief = buildDisplayChiefComplaint(service);
  const symptoms = extracted.symptoms || [];

  const fullExtracted: Record<string, unknown> = {
    ...extracted,
    chief_complaint: chief,
    symptoms,
    source: 'ai_token_intake',
    generated_at: new Date().toISOString(),
  };

  return { chief_complaint: chief, symptoms, extracted: fullExtracted };
}

export type IntakePreview = {
  chiefComplaint: string;
  symptoms: string[];
  ready: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  createToken: (payload: { chiefComplaint: string; symptoms: string[]; visitType: string }) => Promise<string>;
  onComplete: (tokenNumber: string) => void;
  onError: (message: string) => void;
  onPreviewChange?: (preview: IntakePreview) => void;
};

export function AITokenIntakeChat({
  open,
  onOpenChange,
  patientId,
  createToken,
  onComplete,
  onError,
  onPreviewChange,
}: Props) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [voiceLocale, setVoiceLocale] = useState('en-IN');
  const [voiceOutEnabled, setVoiceOutEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const serviceRef = useRef<CohereAIChatService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stopListenRef = useRef<(() => void) | null>(null);
  const sendLockRef = useRef(false);
  const openedRef = useRef(false);
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const ttsOk = isSpeechSynthesisSupported();
  const sttOk = isSpeechRecognitionSupported();

  const pushPreview = useCallback(() => {
    if (!serviceRef.current || !onPreviewChange) return;
    const svc = serviceRef.current;
    const v = validateIntakeForToken(svc);
    const chiefComplaint = buildDisplayChiefComplaint(svc);
    const symptoms = svc.extractPatientData().symptoms || [];
    onPreviewChange({
      chiefComplaint,
      symptoms,
      ready: v.ok,
    });
  }, [onPreviewChange]);

  useEffect(() => {
    if (open) {
      serviceRef.current = createCohereAIChatService(voiceLocale);
      setInput('');
      bump();
      pushPreview();
    } else {
      serviceRef.current = null;
      stopSpeaking();
      if (stopListenRef.current) {
        stopListenRef.current();
        stopListenRef.current = null;
      }
      setListening(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && serviceRef.current) {
      serviceRef.current.setLocale(voiceLocale);
    }
  }, [voiceLocale, open]);

  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      return;
    }
    if (!voiceOutEnabled || !ttsOk) return;
    if (openedRef.current) return;
    openedRef.current = true;
    const timer = window.setTimeout(() => {
      const svc = serviceRef.current;
      const first = svc?.getHistory()?.[0];
      if (first?.role === 'assistant') {
        speakText(first.content, voiceLocale).catch(() => {});
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [open, voiceOutEnabled, voiceLocale, ttsOk]);

  const messages = serviceRef.current?.getHistory() ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !serviceRef.current || sendLockRef.current) return;
      sendLockRef.current = true;
      setSending(true);
      try {
        const reply = await serviceRef.current.sendMessage(trimmed);
        setInput('');
        bump();
        pushPreview();
        if (voiceOutEnabled && ttsOk && reply) {
          await speakText(reply, voiceLocale).catch(() => {});
        }
      } catch (e: unknown) {
        onError(e instanceof Error ? e.message : 'Could not reach AI');
      } finally {
        sendLockRef.current = false;
        setSending(false);
      }
    },
    [onError, pushPreview, voiceLocale, voiceOutEnabled, ttsOk]
  );

  const handleSend = () => {
    void sendMessage(input);
  };

  const toggleListen = () => {
    if (listening) {
      stopListenRef.current?.();
      stopListenRef.current = null;
      setListening(false);
      return;
    }
    if (!sttOk) {
      onError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    setListening(true);
    const stop = startContinuousListeningWithSilence(voiceLocale, {
      silenceMs: DEFAULT_VOICE_SILENCE_MS,
      onTranscriptUpdate: (transcript) => {
        setInput(transcript);
      },
      onSilence: (finalText) => {
        stopListenRef.current?.();
        stopListenRef.current = null;
        setListening(false);
        void sendMessage(finalText);
      },
      onError: (msg) => {
        onError(msg);
        stopListenRef.current = null;
        setListening(false);
      },
    });
    if (stop) stopListenRef.current = stop;
    else setListening(false);
  };

  const handleGenerateToken = async () => {
    if (!serviceRef.current) return;
    const check = validateIntakeForToken(serviceRef.current);
    if (!check.ok) {
      onError(check.message || 'Please provide more details before generating a token.');
      return;
    }

    setFinalizing(true);
    stopSpeaking();
    try {
      const { chief_complaint, symptoms, extracted } = buildIntakeFromChat(serviceRef.current);

      const { error: convError } = await supabase.from('ai_conversations').insert({
        session_id: serviceRef.current.getSessionId(),
        patient_id: patientId,
        messages: serviceRef.current.getHistory() as unknown as Record<string, unknown>[],
        language: voiceLocale.split('-')[0] || 'en',
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
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to create token');
    } finally {
      setFinalizing(false);
    }
  };

  const canGenerate =
    serviceRef.current && validateIntakeForToken(serviceRef.current).ok;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI visit intake</DialogTitle>
          <DialogDescription>
            Voice agent: choose a language (e.g. Hindi, Marathi), hear replies with text-to-speech, or use the mic.
            While listening, your words appear as you speak; after about {DEFAULT_VOICE_SILENCE_MS / 1000} seconds of
            silence your message sends automatically. You can still type or press Send anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {voiceOutEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="voice-out" className="cursor-pointer">
                Read replies aloud
              </Label>
              <Switch
                id="voice-out"
                checked={voiceOutEnabled}
                onCheckedChange={setVoiceOutEnabled}
                disabled={!ttsOk}
              />
            </div>
            {!ttsOk && (
              <span className="text-xs text-amber-700">TTS not available in this browser</span>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1 flex-1 min-w-[180px]">
              <Label className="text-xs">Language &amp; voice</Label>
              <Select value={voiceLocale} onValueChange={setVoiceLocale}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_LOCALES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

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
            placeholder={sttOk ? 'Type or use the mic…' : 'Type your message…'}
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
          <Button
            type="button"
            variant={listening ? 'destructive' : 'outline'}
            className="shrink-0 self-end h-10 w-10 p-0"
            onClick={toggleListen}
            disabled={!sttOk || sending}
            title={sttOk ? (listening ? 'Stop listening' : 'Speak (voice input)') : 'Voice input not supported'}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
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
            <Button
              type="button"
              onClick={handleGenerateToken}
              disabled={finalizing || sending || !canGenerate}
              title={!canGenerate ? 'Share more detail about your visit before generating a token' : undefined}
            >
              {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className="ml-2">Generate token</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
