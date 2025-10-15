import { getQuizQuestionsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import QuestionItem from './questionItem';

const QuizQuestions = ({ quizUuid }: { quizUuid: string }) => {
  const { data } = useQuery(getQuizQuestionsOptions({ path: { quizUuid } }));

  return (
    <div className='mt-2 ml-4 space-y-2'>
      {Array.isArray(data?.data) && data.data.length > 0 ? (
        data.data.map((question: any, qIndex: number) => (
          <QuestionItem
            key={question.uuid}
            quizUuid={quizUuid}
            question={question}
            qIndex={qIndex}
          />
        ))
      ) : (
        <p className='text-muted-foreground text-sm'>No questions added yet.</p>
      )}
    </div>
  );
};

export default QuizQuestions;
