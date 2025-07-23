import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const reviewsData = [
  {
    id: 'review_1',
    student: {
      name: 'Alice Johnson',
      avatarUrl: '/avatars/01.png',
    },
    course: 'Mastering Next.js',
    rating: 5,
    comment:
      'This was an amazing course! The instructor explained everything clearly, and the projects were very helpful. Highly recommended!',
    date: '2023-10-25',
  },
  {
    id: 'review_2',
    student: {
      name: 'Bob Williams',
      avatarUrl: '/avatars/02.png',
    },
    course: 'GraphQL for Beginners',
    rating: 4,
    comment:
      'A great introduction to GraphQL. I feel much more confident using it now. Some parts were a bit fast-paced, but overall very good.',
    date: '2023-10-23',
  },
  {
    id: 'review_3',
    student: {
      name: 'Charlie Brown',
      avatarUrl: '/avatars/03.png',
    },
    course: 'Mastering Next.js',
    rating: 5,
    comment:
      "I've taken a few Next.js courses, and this was by far the best. The advanced topics were covered in-depth and were easy to follow.",
    date: '2023-10-22',
  },
  {
    id: 'review_4',
    student: {
      name: 'Alice Johnson',
      avatarUrl: '/avatars/01.png',
    },
    course: 'Mastering Next.js',
    rating: 5,
    comment:
      'This was an amazing course! The instructor explained everything clearly, and the projects were very helpful. Highly recommended!',
    date: '2023-10-25',
  },
  {
    id: 'review_5',
    student: {
      name: 'Bob Williams',
      avatarUrl: '/avatars/02.png',
    },
    course: 'GraphQL for Beginners',
    rating: 4,
    comment:
      'A great introduction to GraphQL. I feel much more confident using it now. Some parts were a bit fast-paced, but overall very good.',
    date: '2023-10-23',
  },
  {
    id: 'review_6',
    student: {
      name: 'Charlie Brown',
      avatarUrl: '/avatars/03.png',
    },
    course: 'Mastering Next.js',
    rating: 5,
    comment:
      "I've taken a few Next.js courses, and this was by far the best. The advanced topics were covered in-depth and were easy to follow.",
    date: '2023-10-22',
  },
  {
    id: 'review_7',
    student: {
      name: 'Alice Johnson',
      avatarUrl: '/avatars/01.png',
    },
    course: 'Mastering Next.js',
    rating: 5,
    comment:
      'This was an amazing course! The instructor explained everything clearly, and the projects were very helpful. Highly recommended!',
    date: '2023-10-25',
  },
  {
    id: 'review_8',
    student: {
      name: 'Bob Williams',
      avatarUrl: '/avatars/02.png',
    },
    course: 'GraphQL for Beginners',
    rating: 4,
    comment:
      'A great introduction to GraphQL. I feel much more confident using it now. Some parts were a bit fast-paced, but overall very good.',
    date: '2023-10-23',
  },
  {
    id: 'review_9',
    student: {
      name: 'Charlie Brown',
      avatarUrl: '/avatars/03.png',
    },
    course: 'Mastering Next.js',
    rating: 5,
    comment:
      "I've taken a few Next.js courses, and this was by far the best. The advanced topics were covered in-depth and were easy to follow.",
    date: '2023-10-22',
  },
];

const StarRating = ({ rating }: { rating: number }) => (
  <div className='flex items-center'>
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill={i < rating ? 'currentColor' : 'none'}
      />
    ))}
  </div>
);

export default function ReviewsPage() {
  return (
    <div className='space-y-6 p-4 md:p-10'>
      <h2 className='text-2xl font-bold tracking-tight'>Student Reviews</h2>
      <div className='space-y-4'>
        {reviewsData.map(review => (
          <Card key={review.id}>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div>
                  <CardTitle>{review.course}</CardTitle>
                  <CardDescription>
                    Reviewed by {review.student.name} on {review.date}
                  </CardDescription>
                </div>
                <StarRating rating={review.rating} />
              </div>
            </CardHeader>
            <CardContent>
              <div className='flex items-start gap-4'>
                <Avatar>
                  <AvatarImage src={review.student.avatarUrl} />
                  <AvatarFallback>{review.student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p>{review.comment}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
