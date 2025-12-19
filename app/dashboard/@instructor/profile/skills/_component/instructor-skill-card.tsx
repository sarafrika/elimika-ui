import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { BrainCircuit, CheckCircle, Flame } from 'lucide-react';

const normalizeSkill = (skill: any) => {
  const proficiencyMap: Record<string, number> = {
    BEGINNER: 25,
    INTERMEDIATE: 50,
    ADVANCED: 75,
    EXPERT: 90,
  };

  const level = (skill.proficiency_level || '').toUpperCase();

  return {
    uuid: skill.uuid,
    instructor_uuid: skill.instructor_uuid,
    skill_name: skill.skill_name,
    proficiency_level: level,
    proficiency_description: skill.proficiency_description ?? '',
    summary: skill.summary ?? '',

    proficiency_percentage: proficiencyMap[level] ?? 50,
    is_core_skill: true,
    is_teaching_qualified: true,
    skill_category: 'GENERAL',
    market_demand: 'HIGH',

    created_date: skill.created_date,
    updated_date: skill.updated_date ?? skill.created_date,
  };
};

interface InstructorSkillCardProps {
  instructor: any;
  skills: any[];
}

export const InstructorSkillCard: React.FC<InstructorSkillCardProps> = ({ instructor, skills }) => {
  // Normalize incoming API data
  const normalizedSkills = skills.map(normalizeSkill);

  return (
    <Card className='border-border bg-card rounded-[12px] border p-4 shadow-xl'>
      <CardHeader className='flex flex-row items-center gap-4 p-0'>
        <Avatar className='h-14 w-14'>
          <AvatarImage src={instructor.profile_image_url} alt={instructor.full_name} />
          <AvatarFallback>{instructor.full_name?.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className='flex-1'>
          <CardTitle className='text-lg font-semibold'>{instructor.full_name}</CardTitle>
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
            key={skill.uuid}
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
};
