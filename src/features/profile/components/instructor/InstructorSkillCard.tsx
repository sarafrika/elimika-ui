import { format } from 'date-fns';
import { BrainCircuit, CheckCircle, Flame } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Instructor, InstructorSkill, ProficiencyLevelEnum } from '@/services/client';

type InstructorSummary = Pick<Instructor, 'full_name' | 'professional_headline'> & {
  profile_image_url?: string | null;
};

type NormalizedSkill = {
  uuid?: string;
  skill_name: string;
  proficiency_level: ProficiencyLevelEnum;
  proficiency_description: string;
  summary: string;
  proficiency_percentage: number;
  is_core_skill: boolean;
  is_teaching_qualified: boolean;
  market_demand: string;
  updated_date: Date | string;
};

const proficiencyMap: Record<ProficiencyLevelEnum, number> = {
  BEGINNER: 25,
  INTERMEDIATE: 50,
  ADVANCED: 75,
  EXPERT: 90,
};

const normalizeProficiencyLevel = (level?: string | null): ProficiencyLevelEnum => {
  switch ((level ?? '').toUpperCase()) {
    case 'INTERMEDIATE':
      return 'INTERMEDIATE';
    case 'ADVANCED':
      return 'ADVANCED';
    case 'EXPERT':
      return 'EXPERT';
    case 'BEGINNER':
    default:
      return 'BEGINNER';
  }
};

const normalizeSkill = (skill: InstructorSkill): NormalizedSkill => {
  const level = normalizeProficiencyLevel(skill.proficiency_level);

  return {
    uuid: skill.uuid,
    skill_name: skill.skill_name,
    proficiency_level: level,
    proficiency_description: skill.proficiency_description ?? '',
    summary: skill.summary ?? '',
    proficiency_percentage: proficiencyMap[level] ?? 50,
    is_core_skill: true,
    is_teaching_qualified: true,
    market_demand: 'HIGH',
    updated_date: skill.updated_date ?? skill.created_date ?? new Date(),
  };
};

interface InstructorSkillCardProps {
  instructor: InstructorSummary;
  skills: InstructorSkill[];
}

export function InstructorSkillCard({ instructor, skills }: InstructorSkillCardProps) {
  // Normalize incoming API data
  const normalizedSkills = skills.map(normalizeSkill);
  const fullName = instructor.full_name ?? 'Instructor';
  const profileImageUrl = instructor.profile_image_url ?? undefined;

  return (
    <Card className='border-border bg-card rounded-[12px] border p-4 shadow-xl'>
      <CardHeader className='flex flex-row items-center gap-4 p-0'>
        <Avatar className='h-14 w-14'>
          <AvatarImage src={profileImageUrl} alt={fullName} />
          <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className='flex-1'>
          <CardTitle className='text-lg font-semibold'>{fullName}</CardTitle>
          <p className='text-muted-foreground text-sm'>{instructor.professional_headline}</p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Total Skills: {normalizedSkills.length}
          </p>
        </div>
      </CardHeader>

      <CardContent className='space-y-4 p-1'>
        {normalizedSkills.length === 0 && (
          <p className='text-muted-foreground text-sm'>No skills added yet.</p>
        )}

        {normalizedSkills.map(skill => (
          <div
            key={skill.uuid ?? skill.skill_name}
            className='border-border rounded-[20px] border p-2 backdrop-blur lg:p-4'
          >
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-sm font-medium'>{skill.skill_name}</h3>
                <p className='text-muted-foreground text-xs'>{skill.summary}</p>
              </div>
              <Badge variant='outline' className='text-xs'>
                {skill.proficiency_level}
              </Badge>
            </div>

            <p className='text-muted-foreground mt-2 text-xs'>{skill.proficiency_description}</p>

            <div className='mt-4 flex items-center gap-2 text-xs'>
              <Progress value={skill.proficiency_percentage} className='h-1.5 w-full' />
              <span className='min-w-[35px] text-right font-medium'>
                {skill.proficiency_percentage}%
              </span>
            </div>

            <div className='mt-2 grid grid-cols-2 gap-2 text-xs'>
              <div className='flex items-center gap-1.5'>
                <CheckCircle className='h-3.5 w-3.5 text-green-600' />
                <span>{skill.is_core_skill ? 'Core Skill' : 'Supplementary'}</span>
              </div>

              <div className='flex items-center gap-1.5'>
                <BrainCircuit className='text-accent h-3.5 w-3.5' />
                <span>{skill.is_teaching_qualified ? 'Qualified to Teach' : 'Not Teaching'}</span>
              </div>

              <div className='col-span-2 flex items-center gap-1.5'>
                <Flame className='h-3.5 w-3.5 text-orange-500' />
                <span>Market Demand: {skill.market_demand}</span>
              </div>

              <div className='text-muted-foreground col-span-2 text-[10px]'>
                Last updated: {format(new Date(skill.updated_date), 'PPP')}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
