import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { CAPABILITIES, LANDING_FLOW } from '@/data/dashboard';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui';

export function Landing() {
  const navigate = useNavigate();

  function scrollToFlow() {
    document.getElementById('workflow-preview')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-950 bg-radial-fade">
      {/* Top brand row */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Logo />
        <span className="hidden rounded-full border border-ink-600 bg-ink-850/80 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-400 sm:block">
          SIH 2026 · PS 26154
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-2 lg:gap-16 lg:pt-14">
        {/* Left: message */}
        <section aria-labelledby="landing-heading">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/25 bg-accent-500/10 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-accent-300">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden />
            SIH 2026 · PS 26154
          </span>

          <h1 id="landing-heading" className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            <span className="text-gradient-accent">From Information</span>
            <br />
            <span className="text-slate-100">to Action.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
            Transform complex information into clear, targeted communication with one intelligent workflow.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" variant="primary" onClick={() => navigate('/dashboard')} rightIcon={<ArrowRight aria-hidden className="h-4 w-4" />}>
              Enter Platform
            </Button>
            <Button size="lg" variant="secondary" onClick={scrollToFlow} rightIcon={<ChevronDown aria-hidden className="h-4 w-4" />}>
              Explore Workflow
            </Button>
          </div>

          {/* Capability indicators */}
          <dl className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.id}
                className="rounded-xl border border-ink-700/60 bg-ink-850/60 px-4 py-3.5 transition-colors hover:border-ink-500/60"
              >
                <dt className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-slate-200">
                  <cap.icon aria-hidden className="h-4 w-4 text-accent-400" />
                  {cap.title}
                </dt>
                <dd className="mt-1.5 text-xs leading-5 text-slate-400">{cap.description}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Right: transformation flow visualization */}
        <section id="workflow-preview" aria-label="Transformation flow preview" className="relative">
          <div className="rounded-2xl border border-ink-700/60 bg-ink-900/70 p-6 shadow-panel backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.14em] text-slate-400">TRANSFORMATION FLOW</span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                Live pipeline
              </span>
            </div>

            <ol className="relative space-y-1">
              {LANDING_FLOW.map((step, i) => (
                <li key={step.id}>
                  <div className="group flex items-center gap-4 rounded-xl border border-ink-700/50 bg-ink-850/70 px-4 py-3.5 transition-colors hover:border-accent-500/30">
                    <span className="font-mono text-[11px] text-slate-500">0{i + 1}</span>
                    <span className="text-sm font-semibold tracking-[0.12em] text-slate-200 group-hover:text-accent-200">{step.title}</span>
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-400/60 animate-pulse-soft" aria-hidden style={{ animationDelay: `${i * 0.35}s` }} />
                  </div>
                  {i < LANDING_FLOW.length - 1 && <FlowConnector delay={i * 0.35} />}
                </li>
              ))}
            </ol>

            <p className="mt-6 border-t border-ink-700/50 pt-4 text-[11px] leading-5 text-slate-500">
              One source of information — many actionable deliverables: advisories, summaries, posts, decks,
              infographics and video packages.
            </p>
          </div>

          {/* Subtle floating status chip */}
          <div className="absolute -right-3 -top-3 hidden rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 shadow-panel-hover sm:block">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500">OUTPUTS / SOURCE</p>
            <p className="mt-0.5 text-sm font-bold text-slate-100">
              1 → <span className="text-accent-300">7</span>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-800/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-5 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>TRANSFORM-X — From Information to Action.</span>
          <span>Smart India Hackathon 2026 · Problem Statement 26154</span>
        </div>
      </footer>
    </div>
  );
}

/** Animated connector line between flow steps. */
function FlowConnector({ delay = 0 }: { delay?: number }) {
  return (
    <div className="relative mx-auto h-6 w-px overflow-visible bg-ink-600" aria-hidden>
      <span
        className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-accent-400/70 to-accent-400/0 animate-flow-down"
        style={{ animationDelay: `${delay}s` }}
      />
    </div>
  );
}
