import type { ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  HeartPulse,
  Layers,
  Mic,
  Pill,
  Shield,
  Sparkles,
  Stethoscope,
  Target,
  Users,
  Wallet,
} from 'lucide-react';

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) => (
  <section className="rounded-xl border border-border/80 bg-card/50 p-5 shadow-sm">
    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-3">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      {title}
    </h3>
    <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">{children}</div>
  </section>
);

export function PlatformOverview() {
  return (
    <div className="space-y-8 pb-4">
      {/* Vision */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2 flex items-center gap-1.5">
          <Target className="h-4 w-4" />
          Our Vision
        </p>
        <p className="text-base font-medium text-foreground leading-relaxed mb-2">
          Transforming Healthcare Access Through Technology
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          To revolutionize healthcare delivery by creating an inclusive, AI-powered platform that eliminates 
          barriers to quality care—making healthcare accessible, transparent, and efficient for everyone, 
          regardless of literacy levels, language, or technical expertise.
        </p>
      </div>

      {/* Mission */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
          <HeartPulse className="h-4 w-4" />
          Our Mission
        </p>
        <p className="text-base font-medium text-foreground leading-relaxed mb-3">
          Empowering Healthcare Through Innovation
        </p>
        <ul className="text-sm text-muted-foreground space-y-2.5 list-none">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
            <span><strong className="text-foreground">Reduce Waiting Times:</strong> Transform patient experience with virtual queues and real-time updates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
            <span><strong className="text-foreground">Enable Universal Access:</strong> Break language and literacy barriers with AI voice assistance in regional languages</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
            <span><strong className="text-foreground">Digitize Operations:</strong> Streamline hospital workflows from registration to discharge</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
            <span><strong className="text-foreground">Ensure Transparency:</strong> Provide real-time visibility into queue status, doctor availability, and medicine stock</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
            <span><strong className="text-foreground">Optimize Resources:</strong> Leverage AI for intelligent bed allocation and doctor assignment</span>
          </li>
        </ul>
      </div>

      {/* Expected Outcomes */}
      <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mb-2 flex items-center gap-1.5">
          <Activity className="h-4 w-4" />
          Expected Outcomes & Impact
        </p>
        <p className="text-base font-medium text-foreground leading-relaxed mb-3">
          Measurable improvements across patient experience, operational efficiency, and healthcare delivery
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div className="rounded-lg border bg-background/50 p-4">
            <p className="text-2xl font-bold text-primary mb-1">30-50%</p>
            <p className="text-xs text-muted-foreground">Reduction in perceived waiting time</p>
          </div>
          <div className="rounded-lg border bg-background/50 p-4">
            <p className="text-2xl font-bold text-primary mb-1">100%</p>
            <p className="text-xs text-muted-foreground">Digital record keeping & transparency</p>
          </div>
          <div className="rounded-lg border bg-background/50 p-4">
            <p className="text-2xl font-bold text-primary mb-1">24/7</p>
            <p className="text-xs text-muted-foreground">AI-assisted patient registration</p>
          </div>
          <div className="rounded-lg border bg-background/50 p-4">
            <p className="text-2xl font-bold text-primary mb-1">Multi-Lingual</p>
            <p className="text-xs text-muted-foreground">Regional language support</p>
          </div>
        </div>

        <ul className="text-sm text-muted-foreground space-y-2.5 list-none">
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">●</span>
            <span><strong className="text-foreground">Patient Experience:</strong> Virtual waiting rooms eliminate physical queues, SMS/WhatsApp notifications keep patients informed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">●</span>
            <span><strong className="text-foreground">Operational Efficiency:</strong> AI-powered resource allocation reduces bottlenecks and optimizes doctor workload</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">●</span>
            <span><strong className="text-foreground">Accessibility:</strong> Voice-based registration serves illiterate and elderly patients in their native language</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">●</span>
            <span><strong className="text-foreground">Trust & Transparency:</strong> Real-time queue visibility and digital records build patient confidence</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">●</span>
            <span><strong className="text-foreground">Revenue Impact:</strong> Increased patient throughput, reduced no-shows, better inventory management</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400 mt-0.5">●</span>
            <span><strong className="text-foreground">Compliance:</strong> Digital audit trails for medicine dispensation and prescription tracking</span>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Core modules & workflow
        </h4>
        <div className="space-y-3">
          <Section title="1. Patient module" icon={HeartPulse}>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Web access or optional AI voice call; OTP login</li>
              <li>Optional voice assistant: collects details and auto-fills registration</li>
              <li>Unique Patient ID and token number; virtual waiting room with live queue</li>
              <li>SMS / WhatsApp notifications</li>
              <li>Digital health records, documents, medicine availability & nearby stores</li>
            </ul>
          </Section>
          <Section title="2. Registration desk" icon={Users}>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Offline-friendly manual entry for non-smartphone or low-literacy patients</li>
              <li>Same Patient ID & token; real-time sync with the central system</li>
            </ul>
          </Section>
          <Section title="3. Admin module" icon={BarChart3}>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Dashboard: patients, active tokens, bed availability</li>
              <li>AI-assisted bed allocation and doctor assignment</li>
              <li>Reports: patient flow, peak hours, revenue insights</li>
              <li>Central data for patients, doctors, pharmacy, inventory</li>
            </ul>
          </Section>
          <Section title="4. Doctor module" icon={Stethoscope}>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Secure login; assigned queue; history & reports</li>
              <li>Diagnosis, prescriptions, status (completed / admitted / follow-up)</li>
              <li>Senior doctors: oversight, analytics, throughput & efficiency (roadmap)</li>
            </ul>
          </Section>
          <Section title="5. Medical store (inventory)" icon={Pill}>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Stock levels, expiry tracking, prescription integration</li>
              <li>Alerts for low stock and expiring medicines</li>
            </ul>
          </Section>
          <Section title="6. Medical store sales" icon={Wallet}>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Digital billing; tracks sales and prescribing doctor</li>
              <li>Reduces misuse and manual record gaps; compliance-oriented reporting</li>
            </ul>
          </Section>
        </div>
      </div>

      <Section title="AI components" icon={Sparkles}>
        <ul className="list-disc pl-4 space-y-1.5">
          <li>
            <strong className="text-foreground">Voice assistant:</strong> registration via call, multilingual,
            speech → structured data
          </li>
          <li>
            <strong className="text-foreground">Smart allocation:</strong> doctor load and bed availability
          </li>
          <li>
            <strong className="text-foreground">Analytics (future):</strong> inflow prediction, anomaly
            detection in sales
          </li>
        </ul>
      </Section>

      <Section title="Notifications" icon={Bell}>
        <p>SMS and WhatsApp for token updates, appointment reminders, and medicine availability.</p>
      </Section>

      <Section title="Architecture (high level)" icon={Building2}>
        <ul className="list-disc pl-4 space-y-1.5">
          <li>Web app for patients, doctors, and admin</li>
          <li>API layer and secure database for patient records, tokens, inventory</li>
          <li>AI services: speech-to-text and decision support</li>
          <li>Integrations: SMS / WhatsApp and other channels</li>
        </ul>
      </Section>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
            <Target className="h-3.5 w-3.5" /> Problems we address
          </p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-3.5">
            <li>Long waits → virtual queue</li>
            <li>Paperwork → digital records</li>
            <li>Literacy barriers → voice AI</li>
            <li>Medicine misuse → digital tracking</li>
            <li>Operational inefficiency → AI-assisted decisions</li>
          </ul>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" /> Expected outcomes
          </p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-3.5">
            <li>30–50% reduction in perceived wait time (target)</li>
            <li>Higher operational efficiency</li>
            <li>Improved transparency and trust</li>
            <li>Better accessibility across patient groups</li>
          </ul>
        </div>
      </div>

     

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-xs font-semibold text-foreground mb-2">Target users</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Small and medium hospitals, government hospitals, clinics, and pharmacy chains.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs font-semibold text-foreground mb-2">Monetization</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Monthly SaaS subscription, tier-based pricing, add-ons (AI analytics, pharmacy integration).
          </p>
        </div>
      </div>

      <Section title="Constraints & considerations" icon={Shield}>
        <ul className="list-disc pl-4 space-y-1.5">
          <li>Data privacy and security</li>
          <li>Low-tech and low-literacy UX</li>
          <li>Network reliability</li>
          <li>Staff training and change management</li>
        </ul>
      </Section>

    
    </div>
  );
}
