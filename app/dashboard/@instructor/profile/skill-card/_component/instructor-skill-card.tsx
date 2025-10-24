import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { BrainCircuit, CheckCircle, Flame } from 'lucide-react';

export type Skill = {
  uuid: string;
  instructor_uuid: string;
  skill_name: string;
  proficiency_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  proficiency_percentage: number;
  proficiency_description: string;
  is_core_skill: boolean;
  is_teaching_qualified: boolean;
  skill_category: string;
  market_demand: 'LOW' | 'MEDIUM' | 'HIGH';
  created_date: string;
  updated_date: string;
};


interface InstructorSkillCardProps {
  instructor: any;
  skills: Skill[]
}

export const InstructorSkillCard: React.FC<InstructorSkillCardProps> = ({ instructor, skills }) => {
  return (
    <Card className="hover:shadow-lg rounded-[12px] border border-blue-200/40 bg-gradient-to-br from-white via-blue-50 to-blue-100/60 shadow-xl shadow-blue-200/40 transition p-4 dark:border-blue-500/25 dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:shadow-blue-900/20">
      <CardHeader className="flex flex-row items-center gap-4 p-0">
        <Avatar className="h-14 w-14">
          <AvatarImage src={instructor.profile_image_url} alt={instructor.full_name} />
          <AvatarFallback>{instructor.full_name?.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <CardTitle className="text-lg font-semibold">{instructor.full_name}</CardTitle>
          <p className="text-muted-foreground text-sm">{instructor.professional_headline}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Total Skills: {skills.length}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-1">
        {skills.length === 0 && (
          <p className="text-muted-foreground text-sm">No skills added yet.</p>
        )}

        {skills.map((skill) => (
          <div
            key={skill.uuid}
            className="rounded-[20px] border border-blue-200/40 bg-white/80 shadow-xl shadow-blue-200/30 backdrop-blur p-2 lg:p-4 dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{skill.skill_name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {skill.skill_category.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {skill.proficiency_level}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">{skill.proficiency_description}</p>

            <div className="flex items-center gap-2 text-xs">
              <Progress value={skill.proficiency_percentage} className="h-1.5 w-full" />
              <span className="min-w-[35px] text-right font-medium">
                {skill.proficiency_percentage}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                <span>{skill.is_core_skill ? 'Core Skill' : 'Supplementary'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5 text-purple-600" />
                <span>
                  {skill.is_teaching_qualified ? 'Qualified to Teach' : 'Not Teaching'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span>Market Demand: {skill.market_demand}</span>
              </div>
              <div className="text-muted-foreground col-span-2 text-[10px]">
                Last updated: {format(new Date(skill.updated_date), 'PPP')}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
