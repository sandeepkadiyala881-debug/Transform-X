import { ShieldAlert, Quote, StickyNote, Film, ImageIcon } from 'lucide-react';
import type {
  OutputBody,
  AdvisoryBody,
  SummaryBody,
  SocialPostBody,
  PresentationBody,
  InfographicBody,
  VideoPackageBody,
} from '@/types';
import { Badge } from '@/components/ui';
import { cx } from '@/utils';

export function OutputBodyRenderer({ body }: { body: OutputBody }) {
  switch (body.kind) {
    case 'advisory':
      return <AdvisoryView body={body} />;
    case 'summary':
      return <SummaryView body={body} />;
    case 'social':
      return <SocialView body={body} />;
    case 'presentation':
      return <PresentationView body={body} />;
    case 'infographic':
      return <InfographicView body={body} />;
    case 'video-package':
      return <VideoPackageView body={body} />;
  }
}

/* --------------------------------- Advisory -------------------------------- */

const SEVERITY_TONE = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'neutral',
} as const;

function AdvisoryView({ body }: { body: AdvisoryBody }) {
  return (
    <article aria-label="Advisory document" className="space-y-6">
      <header className="rounded-xl border border-ink-600/70 bg-ink-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-slate-300">
            <ShieldAlert aria-hidden className="h-4 w-4 text-amber-400" />
            SECURITY ADVISORY
          </p>
          <Badge tone={SEVERITY_TONE[body.severity]}>Severity: {body.severity}</Badge>
        </div>
        <h2 className="mt-3 text-xl font-bold text-slate-50">{body.title}</h2>
      </header>

      {body.sections.map((section) => (
        <section key={section.heading} aria-label={section.heading}>
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-200">{section.heading}</h3>
          {section.paragraphs.map((p, i) => (
            <p key={i} className="mt-2 text-sm leading-6 text-slate-300">
              {p}
            </p>
          ))}
          {section.bullets ? (
            <ul role="list" className="mt-2 space-y-1.5">
              {section.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-300">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}

/* ----------------------------- Executive summary ---------------------------- */

function SummaryView({ body }: { body: SummaryBody }) {
  return (
    <article aria-label="Executive summary" className="space-y-6">
      <div className="rounded-xl border border-ink-600/70 bg-ink-900/60 p-5">
        <p className="text-xs font-bold tracking-[0.18em] text-slate-300">EXECUTIVE BRIEF</p>
        <p className="mt-2 text-lg font-semibold leading-7 text-slate-50">{body.headline}</p>
      </div>

      <section aria-label="Key points">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-200">Key Points</h3>
        <ul role="list" className="mt-3 space-y-2.5">
          {body.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-ink-700/50 bg-ink-900/40 px-4 py-3 text-sm leading-6 text-slate-300">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Decisions required">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-200">Decisions Required</h3>
        <ol role="list" className="mt-3 space-y-2.5">
          {body.decisionsRequired.map((d, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-slate-300">
              <span className="font-mono text-xs font-bold text-amber-300">{i + 1}.</span>
              {d}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}

/* ------------------------------- Social posts ------------------------------- */

function SocialView({ body }: { body: SocialPostBody }) {
  return (
    <article aria-label={`${body.platform} post`} className="mx-auto max-w-xl">
      <div className="rounded-xl border border-ink-600/70 bg-ink-900/60 p-5">
        <div className="flex items-center gap-3 border-b border-ink-700/50 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-accent-500/30 to-ink-800 text-sm font-bold text-accent-200">
            TX
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-100">TRANSFORM-X Operator</p>
            <p className="text-[11px] text-slate-500">
              {body.platform === 'linkedin' ? 'LinkedIn · Professional post' : 'X / Twitter · Post'}
            </p>
          </div>
          <Quote aria-hidden className="ml-auto h-4 w-4 text-slate-600" />
        </div>
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-200">{body.text}</p>
        {body.hashtags.length > 0 && (
          <p className="mt-4 border-t border-ink-700/50 pt-3 text-xs leading-5 text-accent-300">
            {body.hashtags.join(' ')}
          </p>
        )}
      </div>
    </article>
  );
}

/* ------------------------------- Presentation ------------------------------- */

function PresentationView({ body }: { body: PresentationBody }) {
  return (
    <article aria-label="Presentation deck" className="space-y-4">
      {body.slides.map((slide, i) => (
        <section
          key={i}
          aria-label={`Slide ${i + 1}`}
          className="rounded-xl border border-ink-600/70 bg-ink-900/60 p-5"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-slate-500">SLIDE {i + 1} / {body.slides.length}</p>
            <StickyNote aria-hidden className="h-3.5 w-3.5 text-slate-600" />
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-50">{slide.title}</h3>
          <ul role="list" className="mt-3 space-y-1.5">
            {slide.bullets.map((b, j) => (
              <li key={j} className="flex items-start gap-2.5 text-sm leading-6 text-slate-300">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-lg border border-ink-700/50 bg-ink-850/70 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Speaker notes</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{slide.speakerNotes}</p>
          </div>
        </section>
      ))}
    </article>
  );
}

/* -------------------------------- Infographic ------------------------------- */

function InfographicView({ body }: { body: InfographicBody }) {
  return (
    <article aria-label="Infographic" className="space-y-5">
      <div className="rounded-xl border border-accent-500/25 bg-gradient-to-br from-ink-850 to-ink-800 p-6 text-center">
        <p className="text-xs font-bold tracking-[0.18em] text-accent-300">INFOGRAPHIC</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-8 text-slate-50">{body.headline}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {body.stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-ink-600/70 bg-ink-900/60 p-4 text-center">
            <p className="text-2xl font-extrabold text-accent-300">{stat.value}</p>
            <p className="mt-1 text-[11px] leading-4 text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <ul role="list" className="space-y-2">
        {body.callouts.map((c, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-lg border border-ink-700/50 bg-ink-900/40 px-4 py-3 text-sm leading-6 text-slate-300">
            <ImageIcon aria-hidden className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-500" />
            {c}
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ------------------------------- Video package ------------------------------ */

function VideoPackageView({ body }: { body: VideoPackageBody }) {
  return (
    <article aria-label="Video package" className="space-y-6">
      <div className="rounded-xl border border-ink-600/70 bg-ink-900/60 p-5">
        <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-slate-300">
          <Film aria-hidden className="h-4 w-4 text-accent-400" />
          VIDEO PACKAGE
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{body.logline}</p>
      </div>

      <section aria-label="Script and storyboard">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-200">Script & Storyboard</h3>
        <ol role="list" className="mt-3 space-y-3">
          {body.script.map((beat, i) => (
            <li key={i} className="rounded-lg border border-ink-700/50 bg-ink-900/40 p-4">
              <div className="flex items-center gap-3">
                <span className="rounded-md border border-accent-500/30 bg-accent-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-300">
                  {beat.timecode}
                </span>
              </div>
              <p className="mt-2.5 text-sm leading-6 text-slate-200">{beat.narration}</p>
              <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-400">
                <span className="text-slate-500">Visual:</span>
                {beat.visual}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Subtitles">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-200">Subtitles</h3>
        <ol role="list" className="mt-3 space-y-1.5">
          {body.subtitles.map((s, i) => (
            <li key={i} className={cx('rounded-md border border-ink-700/40 bg-ink-900/40 px-4 py-2 text-xs leading-5 text-slate-300')}>
              <span className="mr-2 font-mono text-[10px] text-slate-500">{String(i + 1).padStart(2, '0')}</span>
              {s}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
