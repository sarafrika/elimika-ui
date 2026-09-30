'use client';

import {
  Briefcase,
  FileCheck2,
  GraduationCap,
  Plus,
  Share2,
  Users,
  BookOpen,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { StatCard, type ExperienceRecord } from './SkillsWalletShared';

const fmtRange = (s?: string | null, e?: string | null, cur?: boolean) => {
  const startD = s
    ? new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';
  const endD = cur
    ? 'Present'
    : e
      ? new Date(e).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : '—';
  return `${startD} – ${endD}`;
};

type SkillsWalletExperienceTabProps = {
  experiences?: ExperienceRecord[];
  title?: string;
  description?: string;
  onAddExperience?: () => void;
  onDeleteExperience?: (experience: ExperienceRecord) => void;
};

export function SkillsWalletExperienceTab({
  experiences = [],
  title = 'My Experience',
  description = 'Showcase your work history, internships, volunteering and life experiences.',
  onAddExperience,
  onDeleteExperience,
}: SkillsWalletExperienceTabProps) {
  const catCount = (category: string) =>
    experiences.filter(record => record.category === category).length;

  const stats = [
    {
      icon: Briefcase,
      label: 'Total Experiences',
      value: experiences.length,
      sub: 'Across all categories',
      tint: 'bg-primary/10 text-primary',
    },
    {
      icon: FileCheck2,
      label: 'Work Experience',
      value: catCount('work'),
      sub: 'Professional roles',
      tint: 'bg-primary/10 text-primary',
    },
    {
      icon: GraduationCap,
      label: 'Internships',
      value: catCount('internship'),
      sub: 'Career internships',
      tint: 'bg-secondary text-secondary-foreground',
    },
    {
      icon: Users,
      label: 'Volunteering',
      value: catCount('volunteer'),
      sub: 'Giving back',
      tint: 'bg-warning/10 text-warning',
    },
    {
      icon: BookOpen,
      label: 'Projects',
      value: catCount('project'),
      sub: 'Key projects',
      tint: 'bg-success/10 text-success',
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>{title}</h2>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button className='bg-primary hover:bg-primary/90' onClick={onAddExperience}>
            <Plus className='mr-2 h-4 w-4' /> Add Experience
          </Button>
          <Button variant='outline'>
            <Share2 className='mr-2 h-4 w-4' /> Share Experience
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardContent className='p-6'>
          <div className='relative pl-8'>
            <div className='bg-border absolute top-2 bottom-2 left-3 w-px' />
            {experiences.length > 0 ? (
              <div className='space-y-6'>
                {experiences.map(item => (
                  <div key={item.id} className='group relative'>
                    <div className='bg-primary ring-background absolute top-2 -left-6 h-3 w-3 rounded-full ring-4' />
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <p className='font-semibold'>{item.role}</p>
                          {item.is_current ? (
                            <Badge className='bg-success/10 text-success border-0'>Current</Badge>
                          ) : null}
                        </div>
                        <p className='text-muted-foreground text-sm'>{item.org}</p>
                        <p className='text-muted-foreground mt-1 text-sm'>{item.description}</p>
                        <div className='mt-2 flex flex-wrap gap-1'>
                          {item.tags.map(tag => (
                            <Badge key={tag} variant='outline' className='text-[10px]'>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className='text-muted-foreground shrink-0 text-right text-xs'>
                        <div>{fmtRange(item.start_date, item.end_date, item.is_current)}</div>
                        {onDeleteExperience ? (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive hover:text-destructive mt-2 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0'
                            aria-label={`Delete experience: ${item.role} at ${item.org}`}
                            onClick={() => onDeleteExperience(item)}
                          >
                            <Trash2 className='mr-1 size-4' /> Delete
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm'>
                No live experience records are available yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
