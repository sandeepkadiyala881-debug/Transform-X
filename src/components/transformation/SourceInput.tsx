import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { cx } from '@/utils';
import {
  FileText,
  FileType2,
  Image as ImageIcon,
  Video,
  Link2,
  Upload,
  FolderOpen,
  Eraser,
  ClipboardList,
  Globe,
  Play,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SourceKind } from '@/types';
import { SAMPLE_SOURCE } from '@/data/analysis';
import { Button } from '@/components/ui';
import { formatFileSize } from '@/utils';

export type SourceTab = SourceKind;

const TABS: { id: SourceTab; label: string; icon: LucideIcon }[] = [
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'document', label: 'Document', icon: FileType2 },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'url', label: 'URL', icon: Link2 },
];

export interface SourceInputResult {
  kind: SourceKind;
  title: string;
  content?: string;
  fileName?: string;
  fileSizeBytes?: number;
  url?: string;
}

interface SourceInputProps {
  onReady: (result: SourceInputResult) => void;
}

export function SourceInput({ onReady }: SourceInputProps) {
  const [tab, setTab] = useState<SourceTab>('text');

  /* ---- text tab ---- */
  const [text, setText] = useState('');

  /* ---- file tabs ---- */
  const [file, setFile] = useState<{ name: string; sizeBytes: number; kind: SourceKind } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- url tab ---- */
  const [url, setUrl] = useState('');

  function loadSample() {
    setText(SAMPLE_SOURCE);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped, tab);
  }

  function handleFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0];
    if (chosen) acceptFile(chosen, tab);
  }

  function acceptFile(f: globalThis.File, kind: SourceKind) {
    setFile({ name: f.name, sizeBytes: f.size, kind });
  }

  function submit() {
    switch (tab) {
      case 'text': {
        if (!text.trim()) return;
        // Derive a readable title from the first meaningful line of the source.
        const firstLine = text
          .split('\n')
          .map((l) => l.trim())
          .find((l) => l.length > 3);
        const derived = firstLine ? firstLine.slice(0, 64) : undefined;
        onReady({ kind: 'text', title: derived ?? 'Pasted source content', content: text });
        break;
      }
      case 'document':
      case 'image':
      case 'video':
        if (!file) return;
        onReady({
          kind: tab,
          title: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          fileSizeBytes: file.sizeBytes,
        });
        break;
      case 'url': {
        if (!url.trim()) return;
        let host = 'Webpage source';
        try {
          host = `Article — ${new URL(url.trim()).hostname}`;
        } catch {
          /* keep fallback title for malformed input */
        }
        onReady({ kind: 'url', title: host, url: url.trim() });
        break;
      }
        break;
    }
  }

  const canSubmit =
    (tab === 'text' && text.trim().length > 0) ||
    ((tab === 'document' || tab === 'image' || tab === 'video') && Boolean(file)) ||
    (tab === 'url' && url.trim().length > 0);

  return (
    <section aria-label="Source input" className="flex flex-col overflow-hidden rounded-xl border border-ink-600/60 bg-ink-850/80 shadow-panel">
      {/* Tabs */}
      <div role="tablist" aria-label="Source type" className="flex gap-1 overflow-x-auto border-b border-ink-700/60 px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              'flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-xs font-semibold transition-colors',
              tab === t.id
                ? 'border-b-2 border-accent-400 bg-ink-800/80 text-slate-100'
                : 'border-b-2 border-transparent text-slate-400 hover:bg-ink-800/40 hover:text-slate-200',
            )}
          >
            <t.icon aria-hidden className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="p-4 sm:p-5">
        {tab === 'text' && (
          <div className="flex flex-col">
            <label htmlFor="source-text" className="sr-only">
              Source content
            </label>
            <textarea
              id="source-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your source content here…"
              rows={10}
              className={cx(
                'min-h-[220px] w-full resize-y rounded-lg border border-ink-600 bg-ink-900/70 p-4 font-mono text-[13px] leading-6 text-slate-200 placeholder:text-slate-500',
                'transition-colors focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/30',
              )}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={loadSample} leftIcon={<ClipboardList aria-hidden className="h-3.5 w-3.5" />}>
                Load Sample
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setText('')}
                disabled={!text}
                leftIcon={<Eraser aria-hidden className="h-3.5 w-3.5" />}
              >
                Clear
              </Button>
              <span className="ml-auto text-[11px] text-slate-500">{text.length.toLocaleString('en-IN')} characters</span>
            </div>
          </div>
        )}

        {(tab === 'document' || tab === 'image' || tab === 'video') && (
          <FileDropzone
            kind={tab}
            file={file}
            dragOver={dragOver}
            onDragOver={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onBrowse={() => fileInputRef.current?.click()}
            onClear={() => setFile(null)}
          />
        )}

        {tab === 'url' && (
          <div className="flex flex-col gap-3">
            <label htmlFor="source-url" className="sr-only">
              Article or webpage URL
            </label>
            <div className="relative">
              <Globe aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="source-url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste article or webpage URL"
                className={cx(
                  'h-11 w-full rounded-lg border border-ink-600 bg-ink-900/70 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500',
                  'transition-colors focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/30',
                )}
              />
            </div>
            <p className="text-[11px] text-slate-500">The platform extracts the readable article body for analysis.</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 border-t border-ink-700/60 px-4 py-3.5 sm:px-5">
        <p className="hidden text-[11px] text-slate-500 sm:block">
          Supported today: text, documents, images, video and URLs.
        </p>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {tab === 'url' && (
            <Button variant="secondary" onClick={submit} disabled={!canSubmit} leftIcon={<Globe aria-hidden className="h-4 w-4" />}>
              Analyze Source
            </Button>
          )}
          {(tab === 'document' || tab === 'image' || tab === 'video') && (
            <Button variant="secondary" onClick={submit} disabled={!canSubmit} leftIcon={<Upload aria-hidden className="h-4 w-4" />}>
              Attach Source
            </Button>
          )}
          {tab === 'text' && (
            <Button variant="secondary" onClick={submit} disabled={!canSubmit} leftIcon={<Play aria-hidden className="h-4 w-4" />}>
              Use as Source
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={
          tab === 'document'
            ? '.pdf,.docx,.txt'
            : tab === 'image'
              ? 'image/*'
              : 'video/*'
        }
        onChange={handleFileChosen}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
    </section>
  );
}

/* ------------------------------- File dropzone ------------------------------ */

function FileDropzone({
  kind,
  file,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
  onClear,
}: {
  kind: 'document' | 'image' | 'video';
  file: { name: string; sizeBytes: number; kind: SourceKind } | null;
  dragOver: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onBrowse: () => void;
  onClear: () => void;
}) {
  const meta = {
    document: { title: 'Drop a document here', icon: FileType2, formats: ['PDF', 'DOCX', 'TXT'], accept: '.pdf,.docx,.txt' },
    image: { title: 'Drop an image here', icon: ImageIcon, formats: ['PNG', 'JPG', 'WEBP'], accept: 'image/*' },
    video: { title: 'Drop a video here', icon: Video, formats: ['MP4', 'MOV', 'WEBM'], accept: 'video/*' },
  }[kind];

  const Icon = meta.icon;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cx(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver ? 'border-accent-400/70 bg-accent-500/5' : 'border-ink-600 bg-ink-900/50 hover:border-ink-500',
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-ink-600 bg-ink-800 text-accent-400">
          <Icon aria-hidden className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-200">{meta.title}</p>
        <p className="mt-1 text-[11px] text-slate-500">Supported: {meta.formats.join(' · ')}</p>
        <Button className="mt-4" variant="secondary" onClick={onBrowse} leftIcon={<FolderOpen aria-hidden className="h-4 w-4" />}>
          Browse Files
        </Button>
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-ink-600 bg-ink-800/60 px-4 py-3">
          <FileText aria-hidden className="h-4 w-4 shrink-0 text-accent-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-100">{file.name}</p>
            <p className="text-[11px] text-slate-500">
              {formatFileSize(file.sizeBytes)} · ready for analysis
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClear}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
