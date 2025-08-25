export const mockUsers = {
  student: {
    id: '1',
    email: 'student@example.com',
    role: 'student',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
  },
  instructor: {
    id: '2',
    email: 'instructor@example.com',
    role: 'instructor',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+0987654321',
    specializations: ['React', 'JavaScript', 'TypeScript'],
  },
  organization: {
    id: '3',
    email: 'admin@organization.com',
    role: 'organization',
    name: 'Tech Academy',
    phone: '+1122334455',
  },
};

export const mockCourses = [
  {
    id: '1',
    title: 'Introduction to React',
    description: 'Learn the fundamentals of React development',
    category: 'Programming',
    difficulty: 'Beginner',
    duration: '8 weeks',
    price: 299.99,
    instructorId: '2',
    isPublished: true,
  },
  {
    id: '2',
    title: 'Advanced JavaScript Patterns',
    description: 'Master advanced JavaScript concepts and patterns',
    category: 'Programming',
    difficulty: 'Advanced',
    duration: '12 weeks',
    price: 499.99,
    instructorId: '2',
    isPublished: false,
  },
];

export const mockClasses = [
  {
    id: '1',
    courseId: '1',
    title: 'React Components',
    date: '2024-01-15',
    time: '10:00',
    duration: 120,
    capacity: 30,
    enrolledCount: 25,
  },
];

export const mockApiResponses = {
  session: {
    success: mockUsers.student,
  },
  courses: {
    data: mockCourses,
    total: mockCourses.length,
  },
  classes: {
    data: mockClasses,
    total: mockClasses.length,
  },
  enrollment: {
    success: true,
    enrollmentId: 'enrollment-123',
  },
  payment: {
    success: true,
    paymentId: 'payment-456',
    amount: 299.99,
  },
};
