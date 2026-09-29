import { FileText, FileType2, Image, Video, Link2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SourceKind } from '@/types';

export const SOURCE_KIND_META: Record<SourceKind, { label: string; icon: LucideIcon }> = {
  text: { label: 'Text', icon: FileText },
  document: { label: 'Document', icon: FileType2 },
  image: { label: 'Image', icon: Image },
  video: { label: 'Video', icon: Video },
  url: { label: 'Article', icon: Link2 },
};

/** Small icon chip used in rows and cards to identify a source type. */
export function SourceKindIcon({ kind, className }: { kind: SourceKind; className?: string }) {
  const { icon: Icon } = SOURCE_KIND_META[kind];
  return (
    <span className={className} aria-hidden>
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function SourceKindLabel({ kind }: { kind: SourceKind }) {
  return <>{SOURCE_KIND_META[kind].label}</>;
}
