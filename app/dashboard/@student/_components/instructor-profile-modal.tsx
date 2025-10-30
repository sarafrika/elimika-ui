'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
  DollarSign,
  MapPin,
  Star,
  Users,
  Video,
} from 'lucide-react';
import React, { useState } from 'react';
import { Booking, BookingSlot } from '../browse-courses/instructor/page';
import { BookingCalendar } from './booking-calendar';
import { BookingSummary } from './booking-summary';

type Props = {
  instructor: any;
  onClose: () => void;
  onBookingComplete: (booking: Booking) => void;
};

export const InstructorProfileModal: React.FC<Props> = ({
  instructor,
  onClose,
  onBookingComplete,
}) => {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<BookingSlot[]>([]);

  const handleStartBooking = () => {
    setShowBooking(true);
  };

  const handleBackToProfile = () => {
    setShowBooking(false);
    setSelectedSlots([]);
  };

  const handleBookingComplete = (booking: Booking) => {
    onBookingComplete(booking);
    onClose();
  };

  if (showBooking) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className='max-h-[90vh] max-w-5xl'>
          <DialogTitle />
          <ScrollArea className='mb-8 max-h-[calc(90vh-80px)] py-2'>
            <DialogHeader>
              <DialogTitle>Book Session with {instructor.full_name}</DialogTitle>
            </DialogHeader>
            <div className='mt-4 flex flex-col gap-6'>
              {/* Left: Calendar */}
              <div className=''>
                <BookingCalendar
                  instructor={instructor}
                  selectedSlots={selectedSlots}
                  onSlotsChange={setSelectedSlots}
                />
              </div>

              {/* Right: Summary */}
              <div>
                <BookingSummary
                  instructor={instructor}
                  selectedSlots={selectedSlots}
                  onBack={handleBackToProfile}
                  onBookingComplete={handleBookingComplete}
                />
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-5xl'>
        <DialogTitle />
        <ScrollArea className='mb-8 max-h-[calc(90vh-80px)] py-4'>
          <div className='space-y-6 pr-6'>
            {/* Header */}
            <div className='flex items-start gap-6'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={instructor.profileImage} alt={instructor.name} />
                <AvatarFallback>{instructor?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className='flex-1'>
                <div className='flex items-start justify-between'>
                  <div>
                    <div className='mb-1 flex items-center gap-2'>
                      <h2>{instructor?.full_name}</h2>
                      {/* {instructor.type === 'organization' && (
                                                <Building className="w-5 h-5 text-muted-foreground" />
                                            )} */}
                    </div>
                    <p className='text-muted-foreground'>{instructor?.professional_headline}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className='mt-4 flex flex-wrap items-center gap-4'>
                  <div className='flex items-center gap-1'>
                    <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                    {/* <span>
                                            {instructor.rating.toFixed(1)} ({instructor.totalReviews}{' '}
                                            reviews)
                                        </span> */}
                    <span>x reviews</span>
                  </div>
                  <div className='text-muted-foreground flex items-center gap-1'>
                    <Users className='h-4 w-4' />
                    {/* <span>{instructor.totalStudents} students</span> */}
                    <span>xx students</span>
                  </div>
                  <div className='text-muted-foreground flex items-center gap-1'>
                    <Briefcase className='h-4 w-4' />
                    {/* <span>{instructor.experience} years experience</span> */}
                    <span>xx years experience</span>
                  </div>
                  {instructor?.has_location_coordinates && (
                    <div className='text-muted-foreground flex items-center gap-1'>
                      <MapPin className='h-4 w-4' />
                      <span>
                        {/* {instructor.location.city}, {instructor.location.country} */}
                        City, Country
                      </span>
                    </div>
                  )}
                </div>

                {/* Mode badges */}
                <div className='mt-3 flex gap-2'>
                  {/* {instructor.mode.includes('online') && (
                                        <Badge variant="secondary" className="gap-1">
                                            <Video className="w-3 h-3" />
                                            Online
                                        </Badge>
                                    )}
                                    {instructor.mode.includes('onsite') && (
                                        <Badge variant="secondary" className="gap-1">
                                            <Building className="w-3 h-3" />
                                            Onsite
                                        </Badge>
                                    )} */}
                  <Badge variant='secondary' className='gap-1'>
                    <Video className='h-3 w-3' />
                    Online / Onsite
                  </Badge>
                </div>
              </div>
            </div>

            {/* Book Button */}
            <div className='flex justify-end'>
              <Button onClick={handleStartBooking} size='lg' className='flex items-center gap-2'>
                <Calendar className='h-4 w-4' />
                Book Session
              </Button>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue='overview' className='w-full'>
              <TabsList>
                <TabsTrigger value='overview'>Overview</TabsTrigger>
                <TabsTrigger value='reviews'>
                  {/* Reviews ({reviews?.length}) */}
                  Reviews (xx)
                </TabsTrigger>
                <TabsTrigger value='certifications'>Certifications</TabsTrigger>
                <TabsTrigger value='rates'>Rates</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value='overview' className='space-y-6'>
                {/* Bio */}
                <Card className='p-6'>
                  <h3 className='mb-3'>About</h3>
                  <div className='text-muted-foreground'>
                    <RichTextRenderer htmlString={instructor.bio} />
                  </div>
                </Card>

                {/* Skills */}
                <Card className='p-6'>
                  <h3 className='mb-3'>Skills & Expertise</h3>
                  <div className='flex flex-wrap gap-2'>
                    {skills?.map(skill => (
                      <Badge key={skill} variant='secondary'>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Specializations */}
                <Card className='p-6'>
                  <h3 className='mb-3'>Specializations</h3>
                  <div className='flex flex-wrap gap-2'>
                    {specializations?.map(spec => (
                      <Badge key={spec} variant='outline'>
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Courses */}
                <Card className='mb-6 p-6'>
                  <h3 className='mb-3'>Available Courses</h3>
                  <ul className='space-y-2'>
                    {courses?.map(course => (
                      <li key={course} className='text-muted-foreground flex items-center gap-2'>
                        <CheckCircle className='h-4 w-4 text-green-600' />
                        {course}
                      </li>
                    ))}
                  </ul>
                </Card>
              </TabsContent>

              {/* Certifications Tab */}
              <TabsContent value='certifications' className='space-y-4'>
                {Array.isArray(certifications) && certifications.length > 0 ? (
                  certifications.map(cert => (
                    <Card key={cert.id}>
                      <CardContent className='p-6'>
                        <div className='flex items-start gap-4'>
                          <div className='rounded-lg bg-blue-100 p-3'>
                            <Award className='h-6 w-6 text-blue-600' aria-hidden='true' />
                          </div>
                          <div>
                            <h4 className='text-base font-semibold'>{cert.name}</h4>
                            <p className='text-muted-foreground text-sm'>{cert.issuer}</p>
                            <p className='text-muted-foreground mt-1 text-sm'>
                              Issued {cert.year ? cert.year : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                    <Award className='mb-4 h-10 w-10 text-gray-400' />
                    <h3 className='text-lg font-semibold'>No Certifications Found</h3>
                    <p className='mt-1 text-sm'>
                      You haven&apos;t earned any certifications for this course yet.
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Rates Tab */}
              <TabsContent value='rates' className='space-y-4'>
                <Card className='p-6'>
                  <h3 className='mb-4'>Rate Card</h3>
                  <div className='space-y-4'>
                    <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                      <div>
                        <p>Hourly Rate</p>
                        <p className='text-muted-foreground text-sm'>1 hour session</p>
                      </div>
                      <p className='text-2xl'>
                        {/* {instructor.rateCard.currency} ${instructor.rateCard.hourly} */}
                        rate xx
                      </p>
                    </div>

                    <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                      <div>
                        <p>Half Day</p>
                        <p className='text-muted-foreground text-sm'>4 hours session</p>
                      </div>
                      <p className='text-2xl'>
                        {/* {instructor.rateCard.currency} ${instructor.rateCard.halfDay} */}
                        rate xx
                      </p>
                    </div>

                    <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                      <div>
                        <p>Full Day</p>
                        <p className='text-muted-foreground text-sm'>8 hours session</p>
                      </div>
                      <p className='text-2xl'>
                        {/* {instructor.rateCard.currency} ${instructor.rateCard.fullDay} */}
                        rate xx
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className='mb-6 border-blue-200 bg-blue-50 p-6'>
                  <div className='flex gap-3'>
                    <DollarSign className='h-5 w-5 text-blue-600' />
                    <div>
                      <p className='text-blue-900'>Pricing Information</p>
                      <p className='mt-1 text-sm text-blue-700'>
                        All rates are in KES/NAIRA. Custom packages and group discounts are
                        available. Contact instructor for details.
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const skills = ['Python', 'TensorFlow', 'Pandas', 'Scikit-learn', 'SQL', 'Statistics'];
const specializations = ['Data Science', 'Machine Learning', 'Python', 'AI'];
const courses = ['Introduction to Data Science', 'Machine Learning Fundamentals'];
const certifications = [
  { id: 'cert-3', name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI', year: 2020 },
  { id: 'cert-4', name: 'Google Cloud Professional Data Engineer', issuer: 'Google', year: 2021 },
];
const reviews = [
  {
    id: 'review-3',
    studentName: 'Emily Wang',
    studentImage:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    comment: 'Incredibly knowledgeable and explains complex concepts clearly.',
    date: new Date(2024, 8, 10),
    course: 'Data Science',
  },
];
