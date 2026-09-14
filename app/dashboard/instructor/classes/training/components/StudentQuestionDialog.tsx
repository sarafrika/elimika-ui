'use client';

import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { LiveQuestion } from './PoseQuestionDialog';

export function StudentQuestionDialog({
  question,
  onSubmitted,
}: {
  question: LiveQuestion | null;
  onSubmitted: (answer: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState('');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (question) {
      setOpen(true);
      setChoice('');
      setText('');
      setSubmitted(false);
    } else {
      setOpen(false);
    }
  }, [question?.uuid]);

  if (!question) return null;

  const isText = question.type === 'SHORT_ANSWER';
  const answer = isText ? text.trim() : choice;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {submitted ? 'Answer submitted' : 'Question from your instructor'}
          </DialogTitle>
          <DialogDescription>
            {question.points} point{question.points === 1 ? '' : 's'}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className='flex flex-col items-center gap-3 py-6 text-center'>
            <CheckCircle2 className='text-primary h-10 w-10' />
            <p className='text-muted-foreground text-sm'>
              Your answer was sent. Stay tuned for the next question.
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            <p className='text-foreground text-base font-medium'>{question.text}</p>

            {isText ? (
              <Textarea
                rows={4}
                value={text}
                onChange={event => setText(event.target.value)}
                placeholder='Type your answer…'
              />
            ) : (
              <RadioGroup value={choice} onValueChange={setChoice}>
                {question.options.map(option => (
                  <div
                    key={option.id}
                    className='border-border flex items-center gap-3 rounded-lg border p-3'
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className='flex-1 cursor-pointer'>
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        )}

        <DialogFooter>
          {submitted ? (
            <Button variant='outline' onClick={() => setOpen(false)}>
              Close
            </Button>
          ) : (
            <Button
              disabled={answer.length === 0}
              onClick={() => {
                onSubmitted(answer);
                setSubmitted(true);
              }}
            >
              Submit answer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
