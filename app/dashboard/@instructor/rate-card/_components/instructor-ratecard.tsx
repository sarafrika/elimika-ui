'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart3,
  CheckCircle,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useInstructor } from '../../../../../context/instructor-context';

// Mock rate card data
const RATE_CARDS_DATA = {
  instructor: {
    name: 'John Smith',
    title: 'Senior Software Developer & Instructor',
    rating: 4.9,
    totalBookings: 247,
    totalRevenue: 98750,
    activeRates: 5,
  },
  rateCards: [
    {
      id: 'RC-001',
      title: 'Advanced React Development',
      category: 'Web Development',
      description:
        'Comprehensive React training covering hooks, context, performance optimization, and testing.',
      hourlyRate: 150,
      halfDayRate: 550,
      fullDayRate: 1000,
      features: [
        'Live coding sessions',
        'Project-based learning',
        'Code review and feedback',
        'Resource materials included',
        'Post-training support (1 week)',
      ],
      extras: [
        { name: 'Additional project', price: 200 },
        { name: 'Extended support (1 month)', price: 300 },
        { name: 'Custom curriculum design', price: 500 },
      ],
      packages: [
        {
          name: 'Starter Package',
          duration: '2 days',
          price: 1800,
          features: ['Basic React concepts', 'Hands-on projects', 'Materials'],
        },
        {
          name: 'Professional Package',
          duration: '5 days',
          price: 4500,
          features: ['Complete React ecosystem', 'Advanced patterns', 'Testing', 'Deployment'],
        },
        {
          name: 'Enterprise Package',
          duration: '10 days',
          price: 8500,
          features: [
            'Everything in Professional',
            'Team mentoring',
            'Code review',
            'Custom projects',
          ],
        },
      ],
      status: 'published',
      createdDate: '2024-10-15',
      lastUpdated: '2024-12-01',
      bookings: 45,
      revenue: 67500,
      avgRating: 4.8,
      isPopular: true,
    },
    {
      id: 'RC-002',
      title: 'Data Science Fundamentals',
      category: 'Data Science',
      description:
        'Complete introduction to data science using Python, covering data analysis, visualization, and machine learning basics.',
      hourlyRate: 120,
      halfDayRate: 450,
      fullDayRate: 800,
      features: [
        'Python programming basics',
        'Data manipulation with Pandas',
        'Visualization with Matplotlib/Seaborn',
        'Introduction to Machine Learning',
        'Real-world datasets',
      ],
      extras: [
        { name: 'Advanced ML algorithms', price: 400 },
        { name: 'Industry dataset analysis', price: 250 },
        { name: 'Personalized project mentoring', price: 300 },
      ],
      packages: [
        {
          name: 'Beginner Track',
          duration: '3 days',
          price: 2200,
          features: ['Python basics', 'Data analysis', 'Basic visualization'],
        },
        {
          name: 'Intermediate Track',
          duration: '5 days',
          price: 3800,
          features: ['Advanced analysis', 'ML introduction', 'Project work'],
        },
      ],
      status: 'published',
      createdDate: '2024-09-20',
      lastUpdated: '2024-11-15',
      bookings: 32,
      revenue: 25600,
      avgRating: 4.7,
      isPopular: false,
    },
    {
      id: 'RC-003',
      title: 'UI/UX Design Workshop',
      category: 'Design',
      description:
        'Hands-on design workshop covering user research, wireframing, prototyping, and design systems.',
      hourlyRate: 100,
      halfDayRate: 380,
      fullDayRate: 700,
      features: [
        'Design thinking methodology',
        'User research techniques',
        'Wireframing and prototyping',
        'Design system creation',
        'Figma/Sketch training',
      ],
      extras: [
        { name: 'Personal portfolio review', price: 150 },
        { name: 'Design system template', price: 200 },
        { name: 'Follow-up consultation', price: 120 },
      ],
      packages: [
        {
          name: 'Design Basics',
          duration: '2 days',
          price: 1300,
          features: ['Design principles', 'Basic tools', 'First project'],
        },
        {
          name: 'Professional Designer',
          duration: '4 days',
          price: 2600,
          features: ['Advanced techniques', 'Portfolio development', 'Industry insights'],
        },
      ],
      status: 'draft',
      createdDate: '2024-11-01',
      lastUpdated: '2024-12-10',
      bookings: 0,
      revenue: 0,
      avgRating: 0,
      isPopular: false,
    },
  ],
};

export function InstructorRateCard() {
  const _instructorData = useInstructor();

  const [activeTab, setActiveTab] = useState('overview');
  const [editingCard, setEditingCard] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { instructor, rateCards } = RATE_CARDS_DATA;

  const filteredRateCards = rateCards.filter(card => {
    const matchesSearch =
      searchTerm === '' ||
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateNew = () => {
    setEditingCard({
      id: '',
      title: '',
      category: '',
      description: '',
      hourlyRate: 0,
      halfDayRate: 0,
      fullDayRate: 0,
      features: [],
      extras: [],
      packages: [],
      status: 'draft',
    });
    setIsCreating(true);
  };

  const handleEdit = (card: any) => {
    setEditingCard({ ...card });
    setIsCreating(false);
  };

  const handleSave = () => {
    // console.log('Saving rate card:', editingCard);
    setEditingCard(null);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditingCard(null);
    setIsCreating(false);
  };

  const handleDelete = (cardId: string) => {
    toast.success(`Deleting rate card: ${cardId}`);
  };

  const handlePublish = (cardId: string) => {
    toast.success(`Publishing rate card: ${cardId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success/10 text-success';
      case 'draft':
        return 'bg-warning/10 text-warning';
      case 'paused':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  if (editingCard) {
    return (
      <div className='min-h-screen'>
        {/* Header */}
        <div className='flex items-center justify-end self-end'>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            {!isCreating && <Button onClick={handleSave}>Save Changes</Button>}
          </div>
        </div>

        <div className='container mx-auto py-8'>
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
            {/* Form */}
            <div className='space-y-6 lg:col-span-2'>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='title'>Course Title *</Label>
                      <Input
                        id='title'
                        placeholder='e.g., Advanced React Development'
                        value={editingCard.title}
                        onChange={e => setEditingCard({ ...editingCard, title: e.target.value })}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='category'>Category</Label>
                      <Select
                        value={editingCard.category}
                        onValueChange={value => setEditingCard({ ...editingCard, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select category' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Web Development'>Web Development</SelectItem>
                          <SelectItem value='Data Science'>Data Science</SelectItem>
                          <SelectItem value='Design'>Design</SelectItem>
                          <SelectItem value='Mobile Development'>Mobile Development</SelectItem>
                          <SelectItem value='DevOps'>DevOps</SelectItem>
                          <SelectItem value='Business'>Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='description'>Description</Label>
                    <Textarea
                      id='description'
                      placeholder='Describe what participants will learn and the training format...'
                      rows={4}
                      value={editingCard.description}
                      onChange={e =>
                        setEditingCard({ ...editingCard, description: e.target.value })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Structure</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <div className='space-y-2'>
                      <Label htmlFor='hourlyRate'>Hourly Rate (1 hr)</Label>
                      <div className='relative'>
                        <DollarSign className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                        <Input
                          id='hourlyRate'
                          type='number'
                          placeholder='150'
                          className='pl-10'
                          value={editingCard.hourlyRate}
                          onChange={e =>
                            setEditingCard({ ...editingCard, hourlyRate: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='halfDayRate'>Half Day Rate (4 hrs)</Label>
                      <div className='relative'>
                        <DollarSign className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                        <Input
                          id='halfDayRate'
                          type='number'
                          placeholder='550'
                          className='pl-10'
                          value={editingCard.halfDayRate}
                          onChange={e =>
                            setEditingCard({ ...editingCard, halfDayRate: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='fullDayRate'>Full Day Rate (8 hrs)</Label>
                      <div className='relative'>
                        <DollarSign className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                        <Input
                          id='fullDayRate'
                          type='number'
                          placeholder='1000'
                          className='pl-10'
                          value={editingCard.fullDayRate}
                          onChange={e =>
                            setEditingCard({ ...editingCard, fullDayRate: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <Alert>
                    <DollarSign className='h-4 w-4' />
                    <AlertDescription>
                      Set competitive rates based on your expertise level and market standards.
                      Half-day and full-day rates often offer better value for extended training
                      sessions.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>What&apos;`s Included</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    {editingCard.features?.map((feature: string, index: number) => (
                      <div key={index} className='flex gap-2'>
                        <Input
                          value={feature}
                          onChange={e => {
                            const newFeatures = [...editingCard.features];
                            newFeatures[index] = e.target.value;
                            setEditingCard({ ...editingCard, features: newFeatures });
                          }}
                          placeholder='e.g., Live coding sessions'
                        />
                        <Button
                          variant='outline'
                          size='icon'
                          onClick={() => {
                            const newFeatures = editingCard.features.filter(
                              (_: any, i: number) => i !== index
                            );
                            setEditingCard({ ...editingCard, features: newFeatures });
                          }}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant='outline'
                      onClick={() => {
                        setEditingCard({
                          ...editingCard,
                          features: [...(editingCard.features || []), ''],
                        });
                      }}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Add Feature
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Optional Extras */}
              <Card>
                <CardHeader>
                  <CardTitle>Optional Extras</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    {editingCard.extras?.map((extra: any, index: number) => (
                      <div key={index} className='grid grid-cols-2 gap-2'>
                        <Input
                          value={extra.name}
                          onChange={e => {
                            const newExtras = [...editingCard.extras];
                            newExtras[index] = { ...extra, name: e.target.value };
                            setEditingCard({ ...editingCard, extras: newExtras });
                          }}
                          placeholder='Extra service name'
                        />
                        <div className='flex gap-2'>
                          <div className='relative flex-1'>
                            <DollarSign className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                            <Input
                              type='number'
                              className='pl-10'
                              value={extra.price}
                              onChange={e => {
                                const newExtras = [...editingCard.extras];
                                newExtras[index] = { ...extra, price: Number(e.target.value) };
                                setEditingCard({ ...editingCard, extras: newExtras });
                              }}
                              placeholder='Price'
                            />
                          </div>
                          <Button
                            variant='outline'
                            size='icon'
                            onClick={() => {
                              const newExtras = editingCard.extras.filter(
                                (_: any, i: number) => i !== index
                              );
                              setEditingCard({ ...editingCard, extras: newExtras });
                            }}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant='outline'
                      onClick={() => {
                        setEditingCard({
                          ...editingCard,
                          extras: [...(editingCard.extras || []), { name: '', price: 0 }],
                        });
                      }}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Add Extra
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Eye className='h-5 w-5' />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <h3>{editingCard.title || 'Course Title'}</h3>
                    <p className='text-muted-foreground text-sm'>
                      {editingCard.category || 'Category'}
                    </p>
                  </div>

                  <p className='text-sm'>{editingCard.description || 'Course description...'}</p>

                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-sm'>Hourly Rate</span>
                      <span className='font-medium'>
                        {formatCurrency(editingCard.hourlyRate || 0)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm'>Half Day (4hrs)</span>
                      <span className='font-medium'>
                        {formatCurrency(editingCard.halfDayRate || 0)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-sm'>Full Day (8hrs)</span>
                      <span className='font-medium'>
                        {formatCurrency(editingCard.fullDayRate || 0)}
                      </span>
                    </div>
                  </div>

                  {editingCard.features && editingCard.features.length > 0 && (
                    <div>
                      <h4 className='mb-2 text-sm font-medium'>What&apos;`s Included:</h4>
                      <ul className='space-y-1'>
                        {editingCard.features
                          .filter((f: string) => f.trim())
                          .map((feature: string, index: number) => (
                            <li key={index} className='flex items-center gap-2 text-sm'>
                              <CheckCircle className='h-3 w-3 text-success' />
                              {feature}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {editingCard.extras && editingCard.extras.length > 0 && (
                    <div>
                      <h4 className='mb-2 text-sm font-medium'>Optional Extras:</h4>
                      <ul className='space-y-1'>
                        {editingCard.extras
                          .filter((e: any) => e.name.trim())
                          .map((extra: any, index: number) => (
                            <li key={index} className='flex justify-between text-sm'>
                              <span>{extra.name}</span>
                              <span>{formatCurrency(extra.price)}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Publish Settings</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='status'>Status</Label>
                    <Select
                      value={editingCard.status}
                      onValueChange={value => setEditingCard({ ...editingCard, status: value })}
                    >
                      <SelectTrigger className='w-32'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='draft'>Draft</SelectItem>
                        <SelectItem value='published'>Published</SelectItem>
                        <SelectItem value='paused'>Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    {editingCard.status === 'published'
                      ? 'This rate card will be visible to potential clients.'
                      : editingCard.status === 'draft'
                        ? 'Save as draft to continue editing later.'
                        : 'Temporarily hide this rate card from clients.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      <div className='w-fit bg-destructive text-destructive-foreground'>
        {' '}
        Needs endpoint to fetch courses instructor can train
      </div>

      {/* Header */}
      <div className='flex items-center justify-end self-end'>
        <Button onClick={handleCreateNew}>
          <Plus className='mr-2 h-4 w-4' />
          Create Rate Card
        </Button>
      </div>

      <div className='container mx-auto py-8'>
        {/* Stats Cards */}
        <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-4'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-muted-foreground text-sm'>Total Revenue</p>
                  <p className='text-2xl font-bold text-success'>
                    {formatCurrency(instructor.totalRevenue)}
                  </p>
                </div>
                <TrendingUp className='h-8 w-8 text-success' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-muted-foreground text-sm'>Total Bookings</p>
                  <p className='text-2xl font-bold text-primary'>{instructor.totalBookings}</p>
                </div>
                <Users className='h-8 w-8 text-primary' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-muted-foreground text-sm'>Active Rate Cards</p>
                  <p className='text-primary text-2xl font-bold'>{instructor.activeRates}</p>
                </div>
                <FileText className='text-primary h-8 w-8' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-muted-foreground text-sm'>Avg. Rating</p>
                  <p className='text-2xl font-bold text-orange-600'>{instructor.rating}</p>
                </div>
                <BarChart3 className='h-8 w-8 text-orange-600' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='overview'>Rate Cards Overview</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            <TabsTrigger value='settings'>Settings</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            {/* Filters */}
            <div className='flex items-center gap-4'>
              <div className='relative max-w-md flex-1'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='Search rate cards...'
                  className='pl-10'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-48'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='published'>Published</SelectItem>
                  <SelectItem value='draft'>Draft</SelectItem>
                  <SelectItem value='paused'>Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rate Cards Table */}
            <Card>
              <CardHeader>
                <CardTitle>Your Rate Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b'>
                        <th className='p-4 text-left'>Course Title</th>
                        <th className='p-4 text-left'>Hr/Rate (1 hr)</th>
                        <th className='p-4 text-left'>Half Day Rate (4 hrs)</th>
                        <th className='p-4 text-left'>Day Rate (8 hrs)</th>
                        <th className='p-4 text-left'>Status</th>
                        <th className='p-4 text-left'>Bookings</th>
                        <th className='p-4 text-left'>Revenue</th>
                        <th className='p-4 text-left'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRateCards.map(card => (
                        <tr key={card.id} className='hover:bg-muted/20 border-b'>
                          <td className='p-4'>
                            <div>
                              <h4 className='font-medium'>{card.title}</h4>
                              <p className='text-muted-foreground text-sm'>{card.category}</p>
                              {card.isPopular && (
                                <Badge variant='secondary' className='mt-1 text-xs'>
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className='p-4 font-medium'>{formatCurrency(card.hourlyRate)}</td>
                          <td className='p-4 font-medium'>{formatCurrency(card.halfDayRate)}</td>
                          <td className='p-4 font-medium'>{formatCurrency(card.fullDayRate)}</td>
                          <td className='p-4'>
                            <Badge className={getStatusColor(card.status)}>{card.status}</Badge>
                          </td>
                          <td className='p-4'>{card.bookings}</td>
                          <td className='p-4 font-medium'>{formatCurrency(card.revenue)}</td>
                          <td className='p-4'>
                            <div className='flex gap-1'>
                              <Button variant='ghost' size='sm' onClick={() => handleEdit(card)}>
                                <Edit className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleDelete(card.id)}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                              {card.status === 'draft' && (
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handlePublish(card.id)}
                                >
                                  <CheckCircle className='h-4 w-4' />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredRateCards.length === 0 && (
                  <div className='py-12 text-center'>
                    <DollarSign className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
                    <h3 className='mb-2'>No rate cards found</h3>
                    <p className='text-muted-foreground mb-4'>
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria'
                        : 'Create your first rate card to start offering training services'}
                    </p>
                    <Button onClick={handleCreateNew}>
                      <Plus className='mr-2 h-4 w-4' />
                      Create Your First Rate Card
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='analytics' className='space-y-6'>
            {/* Analytics Content */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {rateCards
                      .filter(card => card.revenue > 0)
                      .map(card => (
                        <div key={card.id} className='flex items-center justify-between'>
                          <div>
                            <p className='font-medium'>{card.title}</p>
                            <p className='text-muted-foreground text-sm'>
                              {card.bookings} bookings
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='font-bold'>{formatCurrency(card.revenue)}</p>
                            <p className='text-muted-foreground text-sm'>★ {card.avgRating}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between'>
                      <span>Average Hourly Rate</span>
                      <span className='font-medium'>
                        {formatCurrency(
                          Math.round(
                            rateCards.reduce((sum, card) => sum + card.hourlyRate, 0) /
                              rateCards.length
                          )
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Most Popular Course</span>
                      <span className='font-medium'>Advanced React Development</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Average Rating</span>
                      <span className='font-medium'>4.8 ★</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Repeat Client Rate</span>
                      <span className='font-medium'>68%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='settings' className='space-y-6'>
            {/* Settings Content */}
            <Card>
              <CardHeader>
                <CardTitle>Rate Card Settings</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4>Auto-publish new rate cards</h4>
                    <p className='text-muted-foreground text-sm'>
                      Automatically make new rate cards visible to clients
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className='flex items-center justify-between'>
                  <div>
                    <h4>Allow direct bookings</h4>
                    <p className='text-muted-foreground text-sm'>
                      Let clients book directly through your rate cards
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className='flex items-center justify-between'>
                  <div>
                    <h4>Show competitor rates</h4>
                    <p className='text-muted-foreground text-sm'>Display market rate comparisons</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
