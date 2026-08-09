'use client';

import { Briefcase, FileCheck2, GraduationCap, Plus, Share2, Users, BookOpen } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { StatCard } from './SkillsWalletShared';

const EXPERIENCE = [
  { id: 'e1', role: 'Frontend Engineer', org: 'Elimika Ltd.', start_date: '2025-01-10', end_date: null, is_current: true, description: 'Building learner-facing product features across the platform.', tags: ['React', 'TypeScript'], category: 'work' as const },
  { id: 'e2', role: 'Data Analyst Intern', org: 'Nairobi Analytics Co.', start_date: '2024-05-01', end_date: '2024-12-01', is_current: false, description: 'Supported the analytics team with reporting and dashboards.', tags: ['SQL', 'Data Analysis'], category: 'internship' as const },
  { id: 'e3', role: 'Volunteer Tech Mentor', org: 'CodeForAll', start_date: '2023-09-01', end_date: '2024-03-01', is_current: false, description: 'Mentored high school students in introductory programming.', tags: ['Mentorship'], category: 'volunteer' as const },
  { id: 'e4', role: 'Personal Portfolio Site', org: 'Independent', start_date: '2023-01-15', end_date: '2023-03-01', is_current: false, description: 'Designed and built a personal portfolio website.', tags: ['Design', 'React'], category: 'project' as const },
];

const fmtRange = (s?: string | null, e?: string | null, cur?: boolean) => {
  const startD = s ? new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
  const endD = cur ? 'Present' : e ? new Date(e).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
  return `${startD} – ${endD}`;
};

export function SkillsWalletExperienceTab() {
  const catCount = (category: string) => EXPERIENCE.filter(record => record.category === category).length;

  const stats = [
    { icon: Briefcase, label: 'Total Experiences', value: EXPERIENCE.length, sub: 'Across all categories', tint: 'bg-primary/10 text-primary' },
    { icon: FileCheck2, label: 'Work Experience', value: catCount('work'), sub: 'Professional roles', tint: 'bg-primary/10 text-primary' },
    { icon: GraduationCap, label: 'Internships', value: catCount('internship'), sub: 'Career internships', tint: 'bg-secondary text-secondary-foreground' },
    { icon: Users, label: 'Volunteering', value: catCount('volunteer'), sub: 'Giving back', tint: 'bg-warning/10 text-warning' },
    { icon: BookOpen, label: 'Projects', value: catCount('project'), sub: 'Key projects', tint: 'bg-success/10 text-success' },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>My Experience</h2>
          <p className='text-sm text-muted-foreground'>
            Showcase your work history, internships, volunteering and life experiences.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button className='bg-primary hover:bg-primary/90'>
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
            <div className='absolute bottom-2 top-2 left-3 w-px bg-border' />
            <div className='space-y-6'>
              {EXPERIENCE.map(item => (
                <div key={item.id} className='relative'>
                  <div className='absolute -left-6 top-2 h-3 w-3 rounded-full bg-primary ring-4 ring-white' />
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <p className='font-semibold'>{item.role}</p>
                        {item.is_current ? <Badge className='border-0 bg-success/10 text-success'>Current</Badge> : null}
                      </div>
                      <p className='text-sm text-muted-foreground'>{item.org}</p>
                      <p className='mt-1 text-sm text-muted-foreground'>{item.description}</p>
                      <div className='mt-2 flex flex-wrap gap-1'>
                        {item.tags.map(tag => (
                          <Badge key={tag} variant='outline' className='text-[10px]'>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className='shrink-0 text-right text-xs text-muted-foreground'>
                      <div>{fmtRange(item.start_date, item.end_date, item.is_current)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
