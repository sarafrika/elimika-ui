'use client';

import { useInstructor } from '@/context/instructor-context';
import EducationSettings from './_component/EducationForm';
import { useEffect, useState } from 'react';
import { InstructorEducation } from '@/services/api/schema';
import Spinner from '@/components/ui/spinner';
import { fetchClient } from '@/services/api/fetch-client';

export default function InstructoEducationPage() {
  return (
    <><EducationSettings /></>
  );
}
