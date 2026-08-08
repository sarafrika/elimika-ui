'use client';

import LocationInput from '@/components/locationInput';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
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
import { Textarea } from '@/components/ui/textarea';
import { coordinatesFromPlace } from '@/lib/location-types';

export type EditableProfileDetails = {
  first_name: string;
  last_name: string;
  professional_headline: string;
  website: string;
  bio: string;
  location_name: string;
  latitude: string;
  longitude: string;
};

export type EditableProfileErrors = Partial<Record<keyof EditableProfileDetails, string>>;

export interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: EditableProfileDetails;
  errors: EditableProfileErrors;
  onChange: (field: keyof EditableProfileDetails, value: string) => void;
  onSubmit: () => void;
  isSaving?: boolean;
  /** Instructors and course creators carry headline / website / coordinates. */
  supportsExtendedDetails?: boolean;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className='text-destructive text-xs'>{message}</p>;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  values,
  errors,
  onChange,
  onSubmit,
  isSaving = false,
  supportsExtendedDetails = false,
}: EditProfileDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (isSaving) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Edit profile details</DialogTitle>
          <DialogDescription>
            Update the information shown at the top of your profile.
          </DialogDescription>
        </DialogHeader>

        <form
          className='space-y-5'
          onSubmit={event => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className='grid gap-5 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='profile-first-name'>First name</Label>
              <Input
                id='profile-first-name'
                value={values.first_name}
                onChange={event => onChange('first_name', event.target.value)}
                placeholder='First name'
              />
              <FieldError message={errors.first_name} />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='profile-last-name'>Last name</Label>
              <Input
                id='profile-last-name'
                value={values.last_name}
                onChange={event => onChange('last_name', event.target.value)}
                placeholder='Last name'
              />
              <FieldError message={errors.last_name} />
            </div>
          </div>

          {supportsExtendedDetails && (
            <div className='grid gap-5 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='profile-headline'>Professional headline</Label>
                <Input
                  id='profile-headline'
                  value={values.professional_headline}
                  onChange={event => onChange('professional_headline', event.target.value)}
                  placeholder='Summarize your expertise in one line'
                />
                <FieldError message={errors.professional_headline} />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='profile-website'>Website</Label>
                <Input
                  id='profile-website'
                  value={values.website}
                  onChange={event => onChange('website', event.target.value)}
                  placeholder='https://yourwebsite.com'
                />
                <FieldError message={errors.website} />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='profile-location'>Where you are based</Label>
                <LocationInput
                  id='profile-location'
                  value={values.location_name}
                  onChange={value => onChange('location_name', value)}
                  placeholder='Search for a place — e.g. Sarit Centre, Nairobi'
                  coordinates={{ latitude: values.latitude, longitude: values.longitude }}
                  onSuggest={response => {
                    const { latitude, longitude } = coordinatesFromPlace(response);
                    if (latitude !== undefined) onChange('latitude', String(latitude));
                    if (longitude !== undefined) onChange('longitude', String(longitude));
                    return response;
                  }}
                />
                <p className='text-muted-foreground text-xs'>
                  {values.latitude && values.longitude
                    ? `Pinned at ${Number(values.latitude).toFixed(5)}, ${Number(values.longitude).toFixed(5)}.`
                    : 'Pick a result and the coordinates fill in automatically.'}
                </p>
                <FieldError message={errors.latitude ?? errors.longitude} />
              </div>
            </div>
          )}

          <div className='w-full space-y-2'>
            <Label htmlFor='profile-bio'>Bio</Label>
            {supportsExtendedDetails ? (
              <SimpleEditor
                value={values.bio}
                onChange={value => onChange('bio', value)}
                isEditable
                showToolbar
              />
            ) : (
              <Textarea
                id='profile-bio'
                value={values.bio}
                onChange={event => onChange('bio', event.target.value)}
                placeholder='Tell people a little about yourself'
                className='block min-h-32 w-full max-w-none resize-y'
              />
            )}
            <FieldError message={errors.bio} />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
