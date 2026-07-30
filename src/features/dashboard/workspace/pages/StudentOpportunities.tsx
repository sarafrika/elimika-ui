import { ArrowUpRight, Award, Briefcase, Calendar, CheckCircle2, Mail, MapPin, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '../../../../../components/empty-state'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { StudentClassInvite, StudentOverviewData, StudentOverviewOpportunity } from '../student-overview/useStudentOverviewData'

type StudentOpportunitiesProps = {
    opportunities: StudentOverviewOpportunity[]
    classInvites: StudentClassInvite[]
    data: StudentOverviewData
}

const StudentOpportunities = ({ opportunities, classInvites, data }: StudentOpportunitiesProps) => {
    // const sampleOpportunities = [
    //     { role: "Junior Web Developer", org: "Bright Wave Marketing", location: "Nairobi, Kenya", type: "Hybrid · Full-Time", match: 82 },
    //     { role: "UI/UX Design Intern", org: "Coursera", location: "Remote", type: "Part-Time · 3 mo", match: 75 },
    //     { role: "Graphic Design Contract", org: "CreativeBrands", location: "In-Office · Nairobi", type: "Contract", match: 68 },
    // ];

    // const sampleClassInvites = [
    //     { title: "Live: Design Systems in Figma", when: "Today · 4:00 PM", host: "Amina Njoroge" },
    //     { title: "Workshop: Portfolio Review", when: "Thu · 6:30 PM", host: "Daniel Mwangi" },
    // ];

    const credentials = data?.certificates?.map((cert) => {
        const title =
            cert.course?.name ||
            cert.program?.title

        return {
            name: title,
            short: title?.charAt(0).toUpperCase(),
            tint: cert.course
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary-foreground",
        };
    }) ?? [];


    return (
        <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary" /> Opportunities matched to you
                        </CardTitle>
                        <CardDescription>Ranked by AI match score</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary">
                        Browse all <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {opportunities.map((o) => (
                        <div key={o.role} className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{o.role}</p>
                                <p className="text-xs text-muted-foreground">{o.org}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {o.location} · {o.type}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-success text-xs font-medium">
                                        <TrendingUp className="h-3 w-3" /> AI match
                                    </div>
                                    <div className="text-lg font-semibold tabular-nums">{o.match}%</div>
                                </div>
                                <Button size="sm" className="bg-primary hover:bg-primary/90">Apply</Button>
                            </div>
                        </div>
                    ))}

                    {opportunities?.length === 0 && (
                        <EmptyState
                            icon={Briefcase}
                            title='No opportunities yet'
                            description='Check back soon — new placements appear here as they open.'
                        />
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" /> Class invites
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {classInvites.map((i) => (
                            <div key={i.title} className="rounded-lg border p-3">
                                <p className="text-sm font-medium">{i.title}</p>
                                <p className="text-xs text-muted-foreground">{i.when} · {i.host}</p>
                                <div className="mt-2 flex gap-2">
                                    <Button size="sm" className="h-7 bg-success hover:bg-success/90">Accept</Button>
                                    <Button size="sm" variant="outline" className="h-7">Later</Button>
                                </div>
                            </div>
                        ))}

                        {classInvites?.length === 0 && (
                            <EmptyState
                                icon={Mail}
                                title='You have no invites yet'
                                description='Check back soon — new invites will appear here.'
                            />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" /> Credentials
                        </CardTitle>
                        <CardDescription>{data.verifiedSkills} skills · {data?.certificates?.length} certificates · 0 badges</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {credentials.map((c) => (
                                <li key={c.name} className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-md grid place-items-center text-xs font-semibold ${c.tint}`}>
                                        {c.short}
                                    </div>
                                    <span className="text-sm flex-1 truncate">{c.name}</span>
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                </li>
                            ))}
                        </ul>

                        {credentials?.length === 0 && (
                            <EmptyState
                                icon={Award}
                                title="You have no credentials yet"
                                description="Complete courses and programs to earn certificates that will appear here."
                            />
                        )}

                        <Button variant="outline" className="w-full mt-3">
                            <Link href={'/dashboard/student/credentials'}>
                                Open vault
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}

export default StudentOpportunities
