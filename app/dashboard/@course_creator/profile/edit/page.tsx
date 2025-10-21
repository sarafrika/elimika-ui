'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import ImageSelector, { ImageType } from '@/components/image-selector';
import LocationInput from '@/components/locationInput';
import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useCourseCreator } from '@/context/course-creator-context';
import { cn, profilePicSvg } from '@/lib/utils';
import { getUserByUuidOptions, updateUserMutation, uploadProfileImageMutation } from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

const generalProfileSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    middle_name: z.string().optional(),
    phone_number: z.string().min(10, 'Enter a valid phone number'),
    dob: z.date({
        required_error: 'Date of birth is required',
        invalid_type_error: 'Invalid date',
    }),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], {
        required_error: 'Gender is required',
    }),
    email: z.string().email(),
    profile_image_url: z.string().optional(),

    location: z.string().optional(),
    professional_headline: z.string().optional(),
    website: z.string().url().optional(),
    bio: z.string().optional(),
});


type GeneralProfileFormValues = z.infer<typeof generalProfileSchema>;

export default function CourseCreatorProfile() {
    const { replaceBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        replaceBreadcrumbs([
            { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
            {
                id: 'general',
                title: 'General',
                url: '/dashboard/profile/general',
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs]);

    const { profile } = useCourseCreator();
    const { data: user } = useQuery({
        ...getUserByUuidOptions({ path: { uuid: profile?.user_uuid as string } }),
        enabled: !!profile?.user_uuid
    })

    /** For handling profile picture preview */
    const fileElmentRef = useRef<HTMLInputElement>(null);
    const [profilePic, setProfilePic] = useState<ImageType>({
        url: user?.data?.profile_image_url || profilePicSvg,
    });

    const domainBadges =
        // @ts-ignore
        user?.data?.user_domain?.map((domain: any) =>
            domain
                .split('_')
                .map((part: any) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ')
        ) ?? [];

    const form = useForm<z.infer<typeof generalProfileSchema>>({
        resolver: zodResolver(generalProfileSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            middle_name: '',
            phone_number: '',
            dob: new Date(),
            gender: 'MALE',
            email: '',
            profile_image_url: '',

            location: '',
            professional_headline: '',
            website: '',
            bio: '',
        },
    });

    const updateCourseCreator = useMutation(updateUserMutation())
    const uploadProfileImage = useMutation(uploadProfileImageMutation())


    const [submitting, setSubmitting] = useState(false);

    function onSubmit(updatedProfileData: GeneralProfileFormValues) {

        if (profilePic.file) {
            const fd = new FormData();
            const fileName = `${crypto.randomUUID()}${profilePic.file.name}`;
            fd.append('profileImage', profilePic.file as Blob, fileName);
            fd.append('profileImage', fileName);

            uploadProfileImage.mutateAsync({ path: { userUuid: profile?.uuid as string }, body: { profileImage: profilePic.file } }, {
                onSuccess: (data) => {
                    // upload profile response
                }
            })
        }

        updateCourseCreator.mutate({ body: { ...updatedProfileData as any }, path: { uuid: profile?.user_uuid as string } }, {
            onSuccess: (data) => {
                toast.success(data?.message)
            }
        })
    }

    useEffect(() => {
        if (!user?.data || !profile) return;

        form.reset({
            username: user.data.username ?? '',
            first_name: user.data.first_name ?? '',
            last_name: user.data.last_name ?? '',
            middle_name: user.data.middle_name ?? '',
            phone_number: user.data.phone_number ?? '',
            dob: user.data.dob ? new Date(user.data.dob) : new Date(),
            gender: user.data.gender ?? 'MALE',
            email: user.data.email ?? '',
            profile_image_url: user.data.profile_image_url ?? '',

            location: '',
            professional_headline: profile.professional_headline ?? '',
            website: profile.website ?? '',
            bio: profile.bio ?? '',
        });

        setProfilePic({
            url: user.data.profile_image_url || profilePicSvg,
        });
    }, [user?.data, profile, form]);

    return (
        <ProfileFormShell
            eyebrow='Course Creator'
            title='General information'
            description='Refresh your coure creator profile so learners and organisations know who you are.'
            badges={domainBadges}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                    <ProfileFormSection
                        title='Personal profile'
                        description='Basic details that appear wherever your instructor profile is shown.'
                    >
                        <div className='space-y-6'>
                            <div className='flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8'>
                                <Avatar className='h-24 w-24 ring-4 ring-background shadow-lg shadow-primary/5'>
                                    <AvatarImage
                                        src={user?.data?.profile_image_url ?? profilePic.url}
                                        alt={`${user?.data?.full_name}`}
                                    />
                                    <AvatarFallback className='bg-primary/10 text-base font-semibold text-primary'>
                                        {`${user?.data?.first_name?.[0]?.toUpperCase() ?? ''}${user?.data?.last_name?.[0]?.toUpperCase() ?? ''}` || 'IN'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='space-y-3'>
                                    <p className='text-sm text-muted-foreground'>
                                        Square images work best. Maximum size is 5MB.
                                    </p>
                                    <div className='flex flex-wrap gap-3'>
                                        <ImageSelector onSelect={setProfilePic} {...{ fileElmentRef }}>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                type='button'
                                                onClick={() => fileElmentRef.current?.click()}
                                            >
                                                Change photo
                                            </Button>
                                        </ImageSelector>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            type='button'
                                            onClick={() => {
                                                setProfilePic({ url: profilePicSvg });
                                                form.setValue('profile_image_url', '');
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name='username'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder='Username' {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className='grid gap-6 sm:grid-cols-2'>
                                <FormField
                                    control={form.control}
                                    name='first_name'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First name</FormLabel>
                                            <FormControl>
                                                <Input placeholder='Oliver' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='last_name'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last name</FormLabel>
                                            <FormControl>
                                                <Input placeholder='Mwangi' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name='middle_name'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Middle name</FormLabel>
                                        <FormControl>
                                            <Input placeholder='Kimani' {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className='grid gap-6 sm:grid-cols-2'>
                                <FormField
                                    control={form.control}
                                    name='phone_number'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone number</FormLabel>
                                            <FormControl>
                                                <Input type='tel' placeholder='+254712345678' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='dob'
                                    render={({ field }) => (
                                        <FormItem className='flex flex-col'>
                                            <FormLabel>Date of birth</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant='outline'
                                                            className={cn(
                                                                'w-full justify-between text-left font-normal',
                                                                !field.value && 'text-muted-foreground'
                                                            )}
                                                        >
                                                            {field.value ? format(field.value, 'PPP') : 'Select date'}
                                                            <CalendarIcon className='ml-2 h-4 w-4 opacity-50' />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className='w-auto p-0' align='start'>
                                                    <Calendar
                                                        mode='single'
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={date => date > new Date() || date < new Date('1900-01-01')}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className='grid gap-6 sm:grid-cols-2'>
                                <FormField
                                    control={form.control}
                                    name='gender'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Select gender' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value='MALE'>Male</SelectItem>
                                                    <SelectItem value='FEMALE'>Female</SelectItem>
                                                    <SelectItem value='OTHER'>Other</SelectItem>
                                                    <SelectItem value='PREFER_NOT_TO_SAY'>Prefer not to say</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='email'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email address</FormLabel>
                                            <FormControl>
                                                <Input readOnly disabled {...field} />
                                            </FormControl>
                                            <p className='text-muted-foreground text-xs'>
                                                Contact support to change your email address.
                                            </p>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </ProfileFormSection>

                    <ProfileFormSection
                        title='Professional summary'
                        description='Introduce your expertise and help learners understand how you teach.'
                        footer={
                            <Button type='submit' className='min-w-40' disabled={submitting}>
                                {submitting ? (
                                    <span className='flex items-center gap-2'>
                                        <Spinner className='h-4 w-4' />
                                        Saving…
                                    </span>
                                ) : (
                                    'Save changes'
                                )}
                            </Button>
                        }
                    >
                        <FormField
                            control={form.control}
                            name='location'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Primary location</FormLabel>
                                    <FormControl>
                                        <LocationInput
                                            {...field}
                                            onSuggest={loc => {
                                                if (loc.features.length > 0) {
                                                    // form.setValue(
                                                    //   'instructor.latitude',
                                                    //   loc.features[0]!.properties.coordinates.latitude
                                                    // );

                                                    // form.setValue(
                                                    //   'instructor.longitude',
                                                    //   loc.features[0]!.properties.coordinates.longitude
                                                    // );
                                                }
                                                return loc;
                                            }}
                                        />
                                    </FormControl>
                                    <FormDescription>Search by town, city, or neighbourhood.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className='grid gap-6 sm:grid-cols-2'>
                            <FormField
                                control={form.control}
                                name='professional_headline'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Professional headline</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder='Mathematics facilitator with 10+ years experience'
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormDescription className='text-xs'>
                                            Appears underneath your name across Elimika.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='website'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website or portfolio</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder='https://yourwebsite.com'
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name='bio'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>About you</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder='Share your teaching philosophy, specialties, and learner outcomes.'
                                            className='min-h-32 resize-y'
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormDescription className='text-xs'>
                                        This appears on your course creator profile and course listings.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </ProfileFormSection>
                </form>
            </Form>
        </ProfileFormShell>
    );
}
