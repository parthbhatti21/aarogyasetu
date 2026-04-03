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
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Objective</p>
        <p className="text-sm text-foreground leading-relaxed">
          Build a scalable SaaS platform that digitizes hospital operations, reduces patient waiting time,
          improves transparency, and enables accessibility for all users—including low-literacy
          patients—using AI.
        </p>
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

      <Section title="Deployment strategy" icon={Layers}>
        <ol className="list-decimal pl-4 space-y-1.5">
          <li>Pilot: registration + token system</li>
          <li>Onboard one hospital</li>
          <li>Free trial (7–30 days)</li>
          <li>Expand doctor and pharmacy modules</li>
          <li>Scale to multiple hospitals</li>
        </ol>
      </Section>

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

      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <p className="text-xs font-semibold uppercase text-primary mb-2 flex items-center gap-1">
          <Mic className="h-3.5 w-3.5" /> Deliverables
        </p>
        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
          <li>Fully functional web platform</li>
          <li>AI voice assistant integration</li>
          <li>Admin dashboard with analytics</li>
          <li>Scalable backend infrastructure</li>
        </ul>
      </div>
    </div>
  );
}
