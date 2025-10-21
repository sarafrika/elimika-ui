import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { BrainCircuit, CheckCircle, Flame } from 'lucide-react';

type Skill = {
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
    skill: Skill;
}

export const InstructorSkillCard: React.FC<InstructorSkillCardProps> = ({ skill }) => {
    return (
        <Card className="transition-shadow hover:shadow-lg">
            <CardHeader >
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">{skill.skill_name}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                            {skill.skill_category.replace(/_/g, ' ').toLowerCase()}
                        </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        {skill.proficiency_level}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="space-y-2">
                    <p className="text-sm">{skill.proficiency_description}</p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Progress value={skill.proficiency_percentage} className="h-2 w-full" />
                        <span className="min-w-[35px] text-xs font-medium text-right">
                            {skill.proficiency_percentage}%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{skill.is_core_skill ? 'Core Skill' : 'Supplementary'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-purple-600" />
                        <span>{skill.is_teaching_qualified ? 'Qualified to Teach' : 'Not Teaching'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>Market Demand: {skill.market_demand}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground col-span-2">
                        <span>
                            Last updated: {format(new Date(skill.updated_date), 'PPP')}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
