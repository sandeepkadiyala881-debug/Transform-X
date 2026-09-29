import {
  ShieldAlert,
  FileText,
  Linkedin,
  Twitter,
  Presentation,
  BarChart3,
  Clapperboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { OutputKind } from '@/types';

export const OUTPUT_ICON: Record<OutputKind, LucideIcon> = {
  advisory: ShieldAlert,
  'executive-summary': FileText,
  linkedin: Linkedin,
  'x-twitter': Twitter,
  presentation: Presentation,
  infographic: BarChart3,
  'video-package': Clapperboard,
};
