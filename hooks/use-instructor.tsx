import { Instructor } from '@/services/api/schema';
import { useState } from 'react';

export default function useInstructor() {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  return instructor;
}
