'use client'

import { searchQuizzesOptions } from "@/services/client/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle } from "lucide-react";
import { useState } from "react";
import RichTextRenderer from "../../../../../components/editors/richTextRenders";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../../../../components/ui/card";
import QuizQuestions from "../../../@course_creator/course-management/lesson/quizQuestions";

export default function QuizPage() {
  // Quiz management
  const { data: quizzesData, refetch: refetchQuizzes, isFetching, isLoading } = useQuery(
    searchQuizzesOptions({ query: { searchParams: { lesson_uuid: '' }, pageable: {} } })
  );

  const [expandedQuizIndexes, setExpandedQuizIndexes] = useState<number[]>([]);
  const toggleQuizQuestions = (index: number) => {
    setExpandedQuizIndexes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return <div>
    <Card>
      <CardHeader className='mt-4'>
        <div className='flex flex-row items-center justify-between gap-4'>
          <p className='text-lg font-semibold'>Skill Quizzes</p>
        </div>
        <p className='text-muted-foreground text-sm'>
          Manage and review quizzes assigned to this skill. Use quizzes to assess learners&apos;
          understanding and reinforce key concepts.
        </p>
      </CardHeader>

      <CardContent>
        {(isFetching && isLoading) ? <div>Loading</div> : <div className='w-full mt-1 flex flex-col gap-2 space-y-2'>
          {quizzesData?.data?.content?.map((quiz: any, i: any) => (
            <div
              key={i}
              className='w-full group flex text-muted-foreground cursor-default items-start justify-between gap-4 rounded-[20px] border border-blue-200/40 bg-white/80 shadow-xl shadow-blue-200/30 backdrop-blur p-4 lg:p-8 dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20'
            >
              <div className="group relative flex flex-row items-start gap-3">

                <div className='flex w-full flex-col gap-2'>
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0'>
                      <div className='rounded-full bg-green-100 text-green-600 p-1'>
                        <CheckCircle className='h-5 w-5' />
                      </div>
                    </div>
                    <div className='flex flex-col w-full gap-2'>
                      {/* Quiz Title */}
                      <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>{quiz.title}</h3>

                      {/* Quiz Description */}
                      <div className='text-sm text-gray-600 dark:text-gray-300'>
                        <RichTextRenderer htmlString={(quiz?.description as string) || 'No skill provided'} />
                      </div>

                      {/* Info Bar: Time Limit + Passing Score */}
                      <div className='flex flex-col md:flex-row md:gap-4 text-sm text-gray-700 dark:text-gray-300 mt-1'>
                        <span className='flex items-center gap-1'>
                          <span>📅</span> {quiz.time_limit_display}
                        </span>
                        <span className='flex items-center gap-1'>
                          <span>🏆</span> Passing Score: {quiz.passing_score}
                        </span>
                      </div>

                      {/* Toggle Button */}
                      <div className='mt-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => toggleQuizQuestions(i)}
                        >
                          {expandedQuizIndexes.includes(i) ? 'Hide Questions' : 'Show Questions'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Conditionally Render Questions */}
                  {expandedQuizIndexes.includes(i) && <QuizQuestions quizUuid={quiz.uuid} />}
                </div>
              </div>

            </div>
          ))}

          {quizzesData?.data?.content?.length === 0 && (
            <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center'>
              <BookOpen className='text-muted-foreground mb-2 h-8 w-8' />
              <p className='font-medium'>No Quiz created yet</p>
              <p className='mt-1 text-sm'>
                Start by creating quizes for your skill under this course.
              </p>
            </div>
          )}
        </div>}


      </CardContent>
    </Card>
  </div>;
}
