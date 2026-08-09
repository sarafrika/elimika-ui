'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Cloud,
  Copy,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Mic,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { TOKEN } from '@/app/dashboard/_components/color-charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Certificate } from '@/services/client/types.gen';

export const WALLET_ID = 'ELM-SW-2026-000245';

export const ICON_MAP: Record<string, LucideIcon> = {
  Code2: Sparkles,
  BarChart3,
  Rocket,
  Mic,
  Palette,
  Cloud,
  Megaphone,
  Globe,
  BookOpen,
};

export type SkillRecord = {
  id: string;
  name: string;
  level: string;
  proficiency_pct: number;
  category: string;
  last_used: string | null;
  icon_key: string;
  icon?: LucideIcon;
  tint?: string;
  course_uuid?: string | null;
  course_title?: string | null;
  class_title?: string | null;
};

export type PortfolioRecord = {
  id: string;
  title: string;
  tag: string;
  description: string;
  views: number;
  likes: number;
  project_date: string;
  featured: boolean;
};

export type CredentialRecord = {
  id: string;
  name: string;
  org: string;
  issued_at: string;
  credential_code: string;
  status: 'Verified' | 'Pending' | 'Expired';
  source: 'platform' | 'external';
};

export type CompetencyRecord = {
  id: string;
  competency: string;
  skill: string;
  level: string;
  level_num: string;
  pct: number;
  evidence_count: number;
  last_updated: string;
  course_id: string | null;
  assessment_id: string | null;
  badge: string;
  source: 'class' | 'assessment';
  course_title?: string | null;
  class_title?: string | null;
};

export type ExperienceRecord = {
  id: string;
  role: string;
  org: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
  tags: string[];
  category: 'work' | 'internship' | 'volunteer' | 'project';
  sort_order: number;
};

export type AchievementRecord = {
  id: string;
  name: string;
  description: string;
  points: number;
  achieved_at: string | null;
  status: 'Completed' | 'In Progress';
  color_key: string;
  progress: number | null;
};

export type VerificationEventRecord = {
  id: string;
  source: 'assessment' | 'competition' | 'instructor_evaluation';
  title: string;
  skill: string;
  change: string;
  date: string;
  status: 'verified' | 'pending' | 'failed';
};

export type SkillsWalletData = {
  skills: SkillRecord[];
  overviewMetrics: {
    skillsProgress: number;
    verifiedSkills: number;
    newSkillsThisMonth: number;
    totalSkills: number;
    completedSkills: number;
    activeSkills: number;
    courseEnrollments: number;
    classEnrollments: number;
  };
  topSkills: SkillRecord[];
  competencies: CompetencyRecord[];
  levelBreakdown: Array<{ name: string; count: number }>;
  categoryCounts: Array<{ name: string; count: number; colorClass: string }>;
  credentials: CredentialRecord[];
  externalCertificates: CredentialRecord[];
  portfolio: PortfolioRecord[];
  certificates: Certificate[];
  studentName: string;
};

export function fmtDate(value?: string | Date | null) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export function fmtMonth(value?: string | Date | null) {
  if (!value) return 'Recently';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function WalletIdCard({ label = 'Your Skills Wallet ID' }: { label?: string }) {
  return (
    <div className='flex flex-col items-end'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <div className='mt-1 flex items-center gap-2'>
        <div className='bg-background rounded-md border px-3 py-1.5 font-mono text-sm'>
          {WALLET_ID}
        </div>
        <Button size='icon' variant='outline' className='h-8 w-8'>
          <Copy className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  actionLabel,
  onAction,
  tint = 'bg-muted text-muted-foreground',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  tint?: string;
}) {
  return (
    <Card className='rounded-sm'>
      <CardContent className='flex items-start gap-4 px-4 py-0'>
        <div className={`grid h-11 w-11 place-items-center rounded-full ${tint}`}>
          <Icon className='h-5 w-5' />
        </div>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-xs'>{label}</p>
          <p className='text-2xl font-semibold tracking-tight'>{value}</p>

          <div className="mt-1">
            {actionLabel && onAction ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs rounded"
                onClick={onAction}
              >
                {actionLabel}
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            ) : sub ? (
              <div className="text-muted-foreground text-xs">
                {sub}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Donut({
  value,
  size = 132,
  stroke = 12,
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#sw-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="sw-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset='0%' stopColor={TOKEN.chart5} />
            <stop offset='100%' stopColor={TOKEN.chart1} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-2xl font-semibold tracking-tight">{value}%</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export function LegendRow({
  colorClass,
  label,
  value,
}: {
  colorClass: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className='flex items-center justify-between text-sm'>
      <span className='flex items-center gap-2'>
        <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
        {label}
      </span>
      <span className='text-muted-foreground tabular-nums'>{value}</span>
    </div>
  );
}

export function SkillProgressRow({
  icon: Icon,
  name,
  level,
  pct,
  tint,
}: {
  icon: LucideIcon;
  name: string;
  level: string;
  pct: number;
  tint: string;
}) {
  return (
    <div className='flex items-center gap-3'>
      <div className={`grid h-8 w-8 place-items-center rounded-md ${tint}`}>
        <Icon className='h-4 w-4' />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between'>
          <p className='truncate text-sm font-medium'>{name}</p>
          <span className='text-muted-foreground text-xs'>{level}</span>
        </div>
        <div className='mt-1 flex items-center gap-2'>
          <Progress value={pct} className='h-1.5 flex-1' />
          <span className='w-9 text-right text-xs tabular-nums'>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

export const SkillsWalletIcons = {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Cloud,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Mic,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} as const;
