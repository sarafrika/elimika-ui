'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
export type LiveQuestion = {
  uuid: string;
  posedAt: number;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  text: string;
  points: number;
  options: { id: string; text: string }[];
};

type QType = LiveQuestion['type'];

export function PoseQuestionDialog({
  open,
  onOpenChange,
  onPose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPose: (question: LiveQuestion) => void;
}) {
  const [type, setType] = useState<QType>('MULTIPLE_CHOICE');
  const [text, setText] = useState('');
  const [points, setPoints] = useState('5');
  const [options, setOptions] = useState(['', '', '', '']);

  const reset = () => {
    setType('MULTIPLE_CHOICE');
    setText('');
    setPoints('5');
    setOptions(['', '', '', '']);
  };

  const canPose =
    text.trim().length > 0 &&
    (type !== 'MULTIPLE_CHOICE' || options.filter(o => o.trim().length > 0).length >= 2);

  const pose = () => {
    const built: LiveQuestion = {
      uuid: `live-${Date.now()}`,
      posedAt: Date.now(),
      type,
      text: text.trim(),
      points: Number(points) || 0,
      options:
        type === 'MULTIPLE_CHOICE'
          ? options
              .map((o, i) => ({ id: `opt-${i}`, text: o.trim() }))
              .filter(o => o.text.length > 0)
          : type === 'TRUE_FALSE'
            ? [
                { id: 'true', text: 'True' },
                { id: 'false', text: 'False' },
              ]
            : [],
    };
    onPose(built);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Pose a question</DialogTitle>
          <DialogDescription>
            Students in the learning view will see this pop up straight away.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Question type</Label>
              <Select value={type} onValueChange={v => setType(v as QType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='MULTIPLE_CHOICE'>Multiple choice</SelectItem>
                  <SelectItem value='TRUE_FALSE'>True / false</SelectItem>
                  <SelectItem value='SHORT_ANSWER'>Short answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='live-points'>Points</Label>
              <Input
                id='live-points'
                type='number'
                min={0}
                value={points}
                onChange={event => setPoints(event.target.value)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='live-text'>Question</Label>
            <Textarea
              id='live-text'
              rows={3}
              value={text}
              onChange={event => setText(event.target.value)}
              placeholder='Which note sits on the second line of the treble clef?'
            />
          </div>

          {type === 'MULTIPLE_CHOICE' ? (
            <div className='space-y-2'>
              <Label>Answer options</Label>
              {options.map((option, index) => (
                <div key={index} className='flex items-center gap-2'>
                  <Input
                    value={option}
                    onChange={event =>
                      setOptions(prev => prev.map((o, i) => (i === index ? event.target.value : o)))
                    }
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={`Remove option ${index + 1}`}
                    disabled={options.length <= 2}
                    onClick={() => setOptions(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
              <Button variant='outline' size='sm' onClick={() => setOptions(prev => [...prev, ''])}>
                <Plus className='mr-1 h-4 w-4' />
                Add option
              </Button>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canPose} onClick={pose}>
            Send to students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
