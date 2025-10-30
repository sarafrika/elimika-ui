import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { getInstructorAvailabilityOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface InstructorCardProps {
  instructor: any;
}

const BookInstructorCard = ({ instructor }: InstructorCardProps) => {
  const {
    full_name,
    professional_headline,
    bio,
    admin_verified,
    website,
    formatted_location,
    uuid,
  } = instructor;

  const [openBookModal, setOpenBookModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data } = useQuery(getInstructorAvailabilityOptions({ path: { instructorUuid: uuid } }));
  const instructorSlots = data?.data || [];

  const slots = [
    { id: 'slot1', label: 'Tuesday, Oct 10 - 9:00 AM' },
    { id: 'slot2', label: 'Wednesday, Oct 11 - 2:00 PM' },
  ];

  if (!instructor?.is_profile_complete) return null;

  return (
    <Card className='w-full max-w-md shadow-sm'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg'>{full_name}</CardTitle>
          {admin_verified && (
            <Badge variant='success' className='text-xs'>
              <BadgeCheckIcon />
              Verified
            </Badge>
          )}
        </div>
        {professional_headline && (
          <CardDescription className='text-muted-foreground text-sm italic'>
            {professional_headline}
          </CardDescription>
        )}
      </CardHeader>
      <Separator />
      <CardContent className='space-y-2 text-sm'>
        {bio && (
          <HTMLTextPreview htmlContent={bio} className='prose prose-sm max-w-none text-gray-700' />
        )}

        {formatted_location && <p className='text-muted-foreground'>📍 {formatted_location}</p>}

        {website && (
          <p className='text-blue-600 hover:underline'>
            🌐{' '}
            <a href={website} target='_blank' rel='noopener noreferrer'>
              Visit Website
            </a>
          </p>
        )}
      </CardContent>

      <CardContent>
        <Button onClick={() => setOpenBookModal(true)}>Book</Button>
      </CardContent>

      {/* Book Instructor Modal */}
      <Dialog open={openBookModal} onOpenChange={setOpenBookModal}>
        <DialogContent className='sm:max-w-md md:max-w-lg'>
          <DialogTitle />
          <DialogHeader>
            <h3 className='text-xl font-semibold text-gray-900'>Book Instuctor</h3>
            <p className='text-sm text-gray-500'>
              Select a time slot to book <strong>{full_name}</strong>.
            </p>
          </DialogHeader>

          <div className='max-h-[300px] space-y-4 overflow-y-auto py-4'>
            {instructorSlots?.length > 0 ? (
              <RadioGroup value={selectedSlot ?? ''} onValueChange={setSelectedSlot}>
                {instructorSlots
                  ?.filter((slot: any) => slot?.custom_pattern !== 'BLOCKED_TIME_SLOT')
                  .map((slot: any) => (
                    <div key={slot?.uuid} className='flex items-center gap-2'>
                      <RadioGroupItem value={slot?.uuid} id={slot?.uuid} />
                      <Label
                        htmlFor={slot?.uuid}
                        className='flex flex-col items-start gap-1 rounded-md px-2 py-1.5'
                      >
                        <p className='text-sm font-medium'>{slot?.uuid}</p>
                        <p className='text-xs'>{slot?.time_range}</p>
                      </Label>
                    </div>
                  ))}
              </RadioGroup>
            ) : (
              <p className='text-muted-foreground text-sm'>No available slots.</p>
            )}
          </div>

          <DialogFooter className='pt-6'>
            <Button
              variant='outline'
              onClick={() => setOpenBookModal(false)}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSlot) {
                  toast.success(`selected slot ${selectedSlot}`);
                }
              }}
              className='w-full sm:w-auto'
            >
              Book Instructor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BookInstructorCard;
