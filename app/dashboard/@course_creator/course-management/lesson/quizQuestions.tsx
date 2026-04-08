import { useUserDomain } from '@/context/user-domain-context';
import { getQuizQuestionsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import type { QuizQuestion } from '@/services/client/types.gen';
import QuestionItem from './questionItem';

type QuizQuestionRecord = QuizQuestion & { uuid: string; quiz_uuid: string };

const QuizQuestions = ({ quizUuid }: { quizUuid: string }) => {
  const { data, isLoading, isFetching } = useQuery(getQuizQuestionsOptions({ path: { quizUuid } }));
  const { activeDomain } = useUserDomain();

  return (
    <div className='mt-2 ml-4 space-y-2'>
      {isLoading && isFetching && <div>Loading...</div>}

      {!isLoading && !isFetching && Array.isArray(data?.data) && data.data.length > 0 ? (
        data.data
          .filter(
            (question): question is QuizQuestionRecord =>
              typeof question.uuid === 'string' && typeof question.quiz_uuid === 'string'
          )
          .map((question, qIndex: number) => (
            <QuestionItem
              key={question.uuid}
              quizUuid={quizUuid}
              question={question}
              qIndex={qIndex}
              userDomain={activeDomain}
            />
          ))
      ) : (
        <p className='text-muted-foreground text-sm'>No questions added yet.</p>
      )}
    </div>
  );
};

export default QuizQuestions;
