import Link from 'next/link';
import React from 'react';

const OnboardingPage = () => {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4'>
      <div className='w-full max-w-4xl rounded-lg bg-white p-8 shadow-xl'>
        <h1 className='mb-10 text-center text-3xl font-bold text-gray-800'>Welcome to Elimika!</h1>
        <p className='mb-12 text-center text-lg text-gray-600'>
          To help us personalize your experience, please select your primary role:
        </p>
        <div className='grid gap-8 md:grid-cols-3'>
          {/* Student Card */}
          <Link href='/onboarding/student' className='block'>
            <div className='flex h-full transform cursor-pointer flex-col justify-between rounded-lg bg-blue-500 p-6 text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-600'>
              <div>
                <h2 className='mb-3 text-2xl font-semibold'>I am a Student</h2>
                <p className='text-sm'>
                  Join courses, access learning materials, and track your progress.
                </p>
              </div>
              <div className='mt-4 text-right font-medium'>Choose &rarr;</div>
            </div>
          </Link>

          {/* Instructor Card */}
          <Link href='/onboarding/instructor' className='block'>
            <div className='flex h-full transform cursor-pointer flex-col justify-between rounded-lg bg-green-500 p-6 text-white shadow-md transition-transform hover:scale-105 hover:bg-green-600'>
              <div>
                <h2 className='mb-3 text-2xl font-semibold'>I am an Instructor</h2>
                <p className='text-sm'>
                  Create courses, manage content, and engage with your students.
                </p>
              </div>
              <div className='mt-4 text-right font-medium'>Choose &rarr;</div>
            </div>
          </Link>

          {/* Institution Card */}
          <Link href='/onboarding/organisation' className='block'>
            <div className='flex h-full transform cursor-pointer flex-col justify-between rounded-lg bg-purple-500 p-6 text-white shadow-md transition-transform hover:scale-105 hover:bg-purple-600'>
              <div>
                <h2 className='mb-3 text-2xl font-semibold'>I represent an Organisation</h2>
                <p className='text-sm'>
                  Manage your organization, oversee instructors, and monitor student activities.
                </p>
              </div>
              <div className='mt-4 text-right font-medium'>Choose &rarr;</div>
            </div>
          </Link>
          {/* <SearchUsers /> */}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
