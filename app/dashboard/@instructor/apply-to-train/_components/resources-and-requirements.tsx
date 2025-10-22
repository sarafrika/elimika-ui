'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Textarea } from '@/components/ui/textarea';

import {
  BookOpen,
  Building,
  DollarSign,
  ExternalLink,
  Megaphone,
  Monitor,
  Users,
  X,
} from 'lucide-react';

interface ResourcesAndRequirementsProps {
  data: any;
  onDataChange: (data: any) => void;
}

// Predefined equipment categories
const EQUIPMENT_CATEGORIES = {
  Hardware: [
    'Laptops/Computers',
    'Tablets',
    'Smartphones',
    'Projectors',
    'Interactive Whiteboards',
    'Cameras',
    'Microphones',
    'Speakers',
    'Headphones',
    'VR/AR Equipment',
  ],
  Software: [
    'Code Editors (VS Code, IntelliJ)',
    'Design Tools (Figma, Adobe Suite)',
    'Collaboration Tools (Slack, Teams)',
    'Video Conferencing (Zoom, Google Meet)',
    'Learning Management System',
    'Cloud Platforms (AWS, Azure, GCP)',
    'Development Tools (Git, Docker)',
    'Analytics Tools',
  ],
  Materials: [
    'Textbooks',
    'Printed Handouts',
    'Workbooks',
    'Reference Guides',
    'Stationery Supplies',
    'Whiteboards/Markers',
    'Notebooks',
    'Certificates/Badges',
  ],
  'Lab Equipment': [
    'Scientific Instruments',
    'Measuring Tools',
    'Safety Equipment',
    'Specialized Hardware',
    'Testing Equipment',
    'Prototyping Materials',
  ],
};

// Predefined software platforms
const SOFTWARE_PLATFORMS = [
  {
    name: 'Zoom',
    type: 'Video Conferencing',
    link: 'https://zoom.us',
    description: 'Video conferencing and webinar platform',
  },
  {
    name: 'Microsoft Teams',
    type: 'Collaboration',
    link: 'https://teams.microsoft.com',
    description: 'Team collaboration and communication',
  },
  {
    name: 'Google Workspace',
    type: 'Productivity',
    link: 'https://workspace.google.com',
    description: 'Collaborative productivity suite',
  },
  {
    name: 'Slack',
    type: 'Communication',
    link: 'https://slack.com',
    description: 'Team messaging and collaboration',
  },
  {
    name: 'Moodle',
    type: 'LMS',
    link: 'https://moodle.org',
    description: 'Learning management system',
  },
  {
    name: 'Canvas',
    type: 'LMS',
    link: 'https://canvas.instructure.com',
    description: 'Educational technology platform',
  },
];

// Simple zod schema — all optional (keeps validation minimal)
const resourcesSchema = z.object({
  selectedEquipment: z.array(z.string()).optional(),
  selectedSoftware: z.array(z.any()).optional(),
  customEquipment: z.array(z.string()).optional(),

  equipmentNotes: z.string().optional(),
  customSoftware: z.string().optional(),
  minBandwidth: z.string().optional(),
  deviceRequirements: z.string().optional(),

  supportNeeded: z.array(z.string()).optional(),
  fundingDetails: z.string().optional(),
  facilitiesDetails: z.string().optional(),
  marketingSupport: z.string().optional(),
  administrativeSupport: z.string().optional(),

  accessibilityRequirements: z.string().optional(),
  specialRequirements: z.string().optional(),
  preparationTime: z.string().optional(),
  costEstimate: z.string().optional(),
});

export type ResourcesFormValues = z.infer<typeof resourcesSchema>;

export function ResourcesAndRequirements({ data, onDataChange }: ResourcesAndRequirementsProps) {
  // keep dynamic lists in state for fast UI updates (unchanged UX)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    data?.selectedEquipment || []
  );
  const [selectedSoftware, setSelectedSoftware] = useState<any[]>(data?.selectedSoftware || []);
  const [customEquipment, setCustomEquipment] = useState<string[]>(data?.customEquipment || []);

  // supportNeeded may be an array of ids
  const [supportNeeded, setSupportNeeded] = useState<string[]>(data?.supportNeeded || []);

  // react-hook-form setup
  const form = useForm<ResourcesFormValues>({
    resolver: zodResolver(resourcesSchema),
    defaultValues: {
      selectedEquipment: data?.selectedEquipment || [],
      selectedSoftware: data?.selectedSoftware || [],
      customEquipment: data?.customEquipment || [],

      equipmentNotes: data?.equipmentNotes || '',
      customSoftware: data?.customSoftware || '',
      minBandwidth: data?.minBandwidth || undefined,
      deviceRequirements: data?.deviceRequirements || undefined,

      supportNeeded: data?.supportNeeded || [],
      fundingDetails: data?.fundingDetails || '',
      facilitiesDetails: data?.facilitiesDetails || '',
      marketingSupport: data?.marketingSupport || '',
      administrativeSupport: data?.administrativeSupport || '',

      accessibilityRequirements: data?.accessibilityRequirements || '',
      specialRequirements: data?.specialRequirements || '',
      preparationTime: data?.preparationTime || undefined,
      costEstimate: data?.costEstimate || undefined,
    },
  });

  // keep form values in sync whenever the local dynamic state changes
  useEffect(() => {
    form.setValue('selectedEquipment', selectedEquipment);
  }, [selectedEquipment, form]);

  useEffect(() => {
    form.setValue('selectedSoftware', selectedSoftware);
  }, [selectedSoftware, form]);

  useEffect(() => {
    form.setValue('customEquipment', customEquipment);
  }, [customEquipment, form]);

  useEffect(() => {
    form.setValue('supportNeeded', supportNeeded);
  }, [supportNeeded, form]);

  /* Handlers (kept as in your original code, but syncing with the form) */
  const handleEquipmentToggle = (equipment: string, category: string) => {
    const itemWithCategory = `${category}: ${equipment}`;
    const newSelection = selectedEquipment.includes(itemWithCategory)
      ? selectedEquipment.filter(item => item !== itemWithCategory)
      : [...selectedEquipment, itemWithCategory];

    setSelectedEquipment(newSelection);
    // keep immediate external update as before (your existing onDataChange)
    onDataChange({ ...data, selectedEquipment: newSelection });
    // form state is synced via effect
  };

  const handleSoftwareToggle = (software: any) => {
    const isSelected = selectedSoftware.find(s => s.name === software.name);
    const newSelection = isSelected
      ? selectedSoftware.filter(s => s.name !== software.name)
      : [...selectedSoftware, software];

    setSelectedSoftware(newSelection);
    onDataChange({ ...data, selectedSoftware: newSelection });
  };

  const addCustomEquipment = (equipment: string) => {
    if (equipment && !customEquipment.includes(equipment)) {
      const newEquipment = [...customEquipment, equipment];
      setCustomEquipment(newEquipment);
      onDataChange({ ...data, customEquipment: newEquipment });
    }
  };

  const removeCustomEquipment = (equipment: string) => {
    const newEquipment = customEquipment.filter(e => e !== equipment);
    setCustomEquipment(newEquipment);
    onDataChange({ ...data, customEquipment: newEquipment });
  };

  const toggleSupportNeeded = (supportId: string, checked: boolean) => {
    const current = supportNeeded || [];
    const updated = checked ? [...current, supportId] : current.filter(s => s !== supportId);
    setSupportNeeded(updated);
    onDataChange({ ...data, supportNeeded: updated });
  };

  // submit handler - merge dynamic state lists with form fields and forward to parent
  const onSubmit = (values: ResourcesFormValues) => {
    const merged = {
      ...data,
      ...values,
      selectedEquipment,
      selectedSoftware,
      customEquipment,
      supportNeeded,
    };
    onDataChange(merged);
    form.reset(merged);

    // console.log(values, "values")
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Materials Needed */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BookOpen className='h-5 w-5' />
              Required Materials & Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Equipment Categories */}
            {Object.entries(EQUIPMENT_CATEGORIES).map(([category, items]) => (
              <div key={category} className='space-y-3'>
                <h4 className='flex items-center gap-2'>
                  <Monitor className='h-4 w-4' />
                  {category}
                </h4>
                <div className='grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4'>
                  {items.map(item => {
                    const itemWithCategory = `${category}: ${item}`;
                    const isSelected = selectedEquipment.includes(itemWithCategory);
                    return (
                      <div key={item} className='flex items-center space-x-2'>
                        <Checkbox
                          id={`${category}-${item}`}
                          checked={isSelected}
                          onCheckedChange={() => handleEquipmentToggle(item, category)}
                        />
                        <Label htmlFor={`${category}-${item}`} className='cursor-pointer text-sm'>
                          {item}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                <Separator />
              </div>
            ))}

            {/* Custom Equipment */}
            <div className='space-y-3'>
              <h4>Custom Equipment/Materials</h4>
              <div className='flex flex-wrap gap-2'>
                {customEquipment.map(equipment => (
                  <Badge key={equipment} variant='secondary'>
                    {equipment}
                    <button
                      onClick={() => removeCustomEquipment(equipment)}
                      className='hover:text-destructive ml-2'
                      type='button'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))}
              </div>

              <Input
                placeholder='Add custom equipment and press Enter'
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value?.trim();
                    if (val) {
                      addCustomEquipment(val);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
            </div>

            {/* Additional Equipment Notes */}
            <div className='space-y-2'>
              <FormField
                control={form.control}
                name='equipmentNotes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Equipment Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        id='equipmentNotes'
                        placeholder='Specify any particular brands, versions, or special requirements for equipment...'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Software/Platform Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Monitor className='h-5 w-5' />
              Software/Platform Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Predefined Software */}
            <div className='space-y-3'>
              <h4>Recommended Platforms</h4>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {SOFTWARE_PLATFORMS.map(software => {
                  const isSelected = selectedSoftware.find((s: any) => s.name === software.name);
                  return (
                    <div
                      key={software.name}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                      onClick={() => handleSoftwareToggle(software)}
                      role='button'
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSoftwareToggle(software);
                        }
                      }}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2'>
                            <h4 className='text-sm font-medium'>{software.name}</h4>
                            <Badge variant='outline' className='text-xs'>
                              {software.type}
                            </Badge>
                          </div>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            {software.description}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          {isSelected && <div className='bg-primary h-2 w-2 rounded-full' />}
                          <ExternalLink className='text-muted-foreground h-3 w-3' />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Software */}
            <div className='space-y-2'>
              <FormField
                control={form.control}
                name='customSoftware'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Software/Platform Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        id='customSoftware'
                        placeholder='List any specific software, applications, or platforms not mentioned above...'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Technical Requirements */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='minBandwidth'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Internet Bandwidth</FormLabel>
                      <FormControl>
                        <Select onValueChange={value => field.onChange(value)} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder='Select bandwidth requirement' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='basic'>Basic (1-5 Mbps)</SelectItem>
                            <SelectItem value='standard'>Standard (5-25 Mbps)</SelectItem>
                            <SelectItem value='high'>High (25-100 Mbps)</SelectItem>
                            <SelectItem value='premium'>Premium (100+ Mbps)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='deviceRequirements'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Requirements</FormLabel>
                      <FormControl>
                        <Select onValueChange={value => field.onChange(value)} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder='Select device requirement' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='any'>Any device (mobile-friendly)</SelectItem>
                            <SelectItem value='tablet-plus'>Tablet or larger</SelectItem>
                            <SelectItem value='laptop-desktop'>Laptop/Desktop only</SelectItem>
                            <SelectItem value='high-spec'>High-specification computer</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Needed */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Building className='h-5 w-5' />
              Support Needed from Institution/Admin
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Support Categories */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {[
                { id: 'funding', label: 'Funding Support', icon: DollarSign },
                { id: 'facilities', label: 'Facilities/Venue', icon: Building },
                { id: 'marketing', label: 'Marketing/Promotion', icon: Megaphone },
                { id: 'coordination', label: 'Student Coordination', icon: Users },
              ].map(support => {
                const IconComponent = support.icon;
                return (
                  <div key={support.id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={support.id}
                      checked={supportNeeded?.includes(support.id) || false}
                      onCheckedChange={checked => toggleSupportNeeded(support.id, !!checked)}
                    />
                    <Label htmlFor={support.id} className='flex cursor-pointer items-center gap-2'>
                      <IconComponent className='h-4 w-4' />
                      {support.label}
                    </Label>
                  </div>
                );
              })}
            </div>

            {/* Detailed Support Requirements */}
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='fundingDetails'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        id='fundingDetails'
                        placeholder='Describe any funding needed (equipment purchase, venue rental, materials, etc.)'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='facilitiesDetails'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facilities Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        id='facilitiesDetails'
                        placeholder='Describe specific venue/facility needs (size, layout, accessibility, etc.)'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='marketingSupport'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marketing/Promotion Support</FormLabel>
                    <FormControl>
                      <Textarea
                        id='marketingSupport'
                        placeholder='What marketing support would be helpful? (student outreach, promotional materials, etc.)'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='administrativeSupport'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Administrative Support</FormLabel>
                    <FormControl>
                      <Textarea
                        id='administrativeSupport'
                        placeholder='Any administrative support needed (enrollment management, attendance tracking, certificate issuance, etc.)'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Requirements & Notes</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <FormField
              control={form.control}
              name='accessibilityRequirements'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accessibility Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      id='accessibilityRequirements'
                      placeholder='Any specific accessibility accommodations needed for inclusive training delivery...'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='specialRequirements'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      id='specialRequirements'
                      placeholder='Any other special requirements, constraints, or considerations...'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='preparationTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preparation Time Needed</FormLabel>
                      <FormControl>
                        <Select onValueChange={value => field.onChange(value)} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder='How much prep time do you need?' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='minimal'>Minimal (1-2 weeks)</SelectItem>
                            <SelectItem value='standard'>Standard (3-4 weeks)</SelectItem>
                            <SelectItem value='extended'>Extended (1-2 months)</SelectItem>
                            <SelectItem value='comprehensive'>Comprehensive (2+ months)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='space-y-2'>
                <FormField
                  control={form.control}
                  name='costEstimate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost Range</FormLabel>
                      <FormControl>
                        <Select onValueChange={value => field.onChange(value)} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="What's your estimated cost?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='free'>Free/Pro Bono</SelectItem>
                            <SelectItem value='low'>Low ($1-500)</SelectItem>
                            <SelectItem value='medium'>Medium ($500-2000)</SelectItem>
                            <SelectItem value='high'>High ($2000-5000)</SelectItem>
                            <SelectItem value='premium'>Premium ($5000+)</SelectItem>
                            <SelectItem value='negotiable'>Negotiable</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className='flex justify-end'>
          <button
            type='submit'
            className='bg-primary inline-flex items-center rounded-md px-4 py-2 text-white hover:opacity-95'
          >
            Save Changes
          </button>
        </div>
      </form>
    </Form>
  );
}
