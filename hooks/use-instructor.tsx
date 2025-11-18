import type { Instructor } from '@/services/api/schema';
import { useState } from 'react';

export default function useInstructor() {
  const [instructor, _setInstructor] = useState<Instructor | null>(null);
  return instructor;
}
