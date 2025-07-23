import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Move all the constants here
const affiliateCourses = [
  {
    category: 'Music',
    items: [
      'Voice',
      'Piano',
      'Guitar',
      'Drums',
      'Violin',
      'Cello',
      'Viola',
      'Bass',
      'Saxophone',
      'Trumpet',
      'Clarinet',
      'Flute',
      'Trombone',
      'Drumline',
      'Marching Band',
      'Pop Band',
      'String Orchestra',
      'Choir',
    ],
  },
  {
    category: 'Sports',
    items: [
      'Football',
      'Swimming',
      'Tennis',
      'Rugby',
      'Athletics',
      'Aerobics',
      'Table tennis',
      'Basketball',
      'Volleyball',
      'Netball',
      'Scatting',
    ],
  },
  { category: 'Dance', items: ['Ballet', 'Contemporary Dance'] },
  { category: 'Theatre', items: ['Musical theatre', 'Technical theatre'] },
  { category: 'Arts', items: ['Painting', 'Sculpture', 'Drawing'] },
];

const ageGroups = ['Kindergarten', 'Lower Primary', 'Upper Primary', 'JSS', 'Secondary', 'Adults'];

const academicPeriods = ['Term', 'Semester', 'Trimester', 'Quarters', 'Non Term'];

export interface InstitutionProfileContentProps {
  uuid?: string;
}

export const InstitutionProfileContent: React.FC<InstitutionProfileContentProps> = ({ uuid }) => {
  const [activeTab, setActiveTab] = useState('age-branch');

  // Move all the state here (except contact details)
  const [locations, setLocations] = useState([
    {
      location: '',
      country: '',
      branchName: '',
      address: '',
      pocName: '',
      pocPhone: '',
      pocEmail: '',
    },
  ]);

  const [ageGroupRows, setAgeGroupRows] = useState([
    {
      branchName: '',
      Kindergarten: false,
      'Lower Primary': false,
      'Upper Primary': false,
      JSS: false,
      Secondary: false,
      Adults: false,
    },
  ]);

  const [branchInfo, setBranchInfo] = useState([
    {
      branchName: '',
      courses: '',
      classType: '',
      method: '',
      classrooms: '',
    },
  ]);

  const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>({});
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [calComLink, setCalComLink] = useState('');
  const [academic, setAcademic] = useState({ period: '', duration: '' });
  const [rateCard, setRateCard] = useState([
    {
      course: '',
      classType: '',
      method: '',
      rate: '',
    },
  ]);

  const [split, setSplit] = useState({ instructor: '', organisation: '' });
  const [instructorPrefs, setInstructorPrefs] = useState([
    {
      course: '',
      type: '',
      gender: '',
      classType: '',
      method: '',
      edu: '',
      experience: '',
      skills: '',
      proBody: '',
      day: '',
      time: '',
      fee: '',
    },
  ]);

  const [schedule, setSchedule] = useState([
    {
      course: '',
      instructor: '',
      lessons: '',
      hours: '',
      hourlyFee: '',
      totalFee: '',
      materialFee: '',
      academicPeriods: '',
      feePerPeriod: '',
    },
  ]);

  // Keep all the styling classes
  const inputClasses =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 bg-white text-gray-900';
  const labelClasses = 'block text-sm font-medium text-gray-700';
  const buttonPrimaryClasses =
    'inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2';
  const buttonSecondaryClasses =
    'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1';
  const buttonDangerClasses =
    'inline-flex items-center justify-center rounded-md border border-red-500 bg-transparent px-3 py-1.5 text-sm font-medium text-red-500 shadow-sm hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1';
  const cardBaseClasses = 'bg-white shadow-xl rounded-xl overflow-hidden';
  const cardContentClasses = 'p-6 sm:p-8';
  const sectionTitleClasses = 'text-2xl font-semibold text-gray-800 mb-6';
  const addMoreButtonClasses =
    'inline-flex items-center text-sky-600 hover:text-sky-800 text-sm font-medium';

  const tabOrder = [
    'age-branch',
    'courses-types',
    'availability-academic',
    'rates-split',
    'schedule-confirmation',
  ];
  const currentTabIndex = tabOrder.indexOf(activeTab);
  const isLastTab = currentTabIndex === tabOrder.length - 1;

  const handleNext = () => {
    const nextTab = tabOrder[currentTabIndex + 1];
    if (nextTab) {
      setActiveTab(nextTab);
    }
  };

  const handlePrevious = () => {
    const prevTab = tabOrder[currentTabIndex - 1];
    if (prevTab) {
      setActiveTab(prevTab);
    }
  };

  // Move all the tab content here
  return (
    <div className='bg-background flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:px-16'>
      <Card className='bg-card mx-auto flex w-full max-w-7xl flex-1 flex-col border-none shadow-none'>
        <CardHeader>
          <CardTitle className='text-center text-3xl font-bold text-sky-700'>
            Institution Profile
          </CardTitle>
        </CardHeader>
        <CardContent className={`${cardContentClasses} flex flex-1 flex-col`}>
          <Tabs
            defaultValue='age-branch'
            value={activeTab}
            className='flex w-full flex-1 flex-col'
            onValueChange={setActiveTab}
          >
            <TabsList className='mb-4 flex w-full space-x-1 overflow-x-auto'>
              <TabsTrigger value='age-branch'>Age Groups & Branch Info</TabsTrigger>
              <TabsTrigger value='courses-types'>Courses & Class Types</TabsTrigger>
              <TabsTrigger value='availability-academic'>Availability & Academic</TabsTrigger>
              <TabsTrigger value='rates-split'>Rates & Split Ratio</TabsTrigger>
              <TabsTrigger value='schedule-confirmation'>Schedule & Confirmation</TabsTrigger>
            </TabsList>

            {/* Move all TabsContent components here */}
            {/* ... Copy all the TabsContent components from the original file ... */}
          </Tabs>
          <div className='mt-auto flex items-center justify-between pt-8'>
            <div>
              {currentTabIndex > 0 && (
                <Button
                  type='button'
                  onClick={handlePrevious}
                  className={`${buttonSecondaryClasses} px-8 py-3 text-base`}
                >
                  Previous
                </Button>
              )}
            </div>
            <Button
              type='button'
              onClick={handleNext}
              className={`${buttonPrimaryClasses} w-full px-8 py-3 text-base sm:w-auto`}
            >
              {isLastTab ? 'Save Profile Changes' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionProfileContent;
