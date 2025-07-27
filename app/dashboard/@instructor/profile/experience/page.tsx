'use client';

import { useInstructor } from '@/context/instructor-context';
import { useEffect, useState } from 'react';
import { InstructorEducation, InstructorExperience } from '@/services/api/schema';
import Spinner from '@/components/ui/spinner';
import { fetchClient } from '@/services/api/fetch-client';
import ProfessionalExperienceSettings from './_component/InstructorExperienceForm';

export default function InstructoEducationPage() {
  return (<ProfessionalExperienceSettings />);
}
