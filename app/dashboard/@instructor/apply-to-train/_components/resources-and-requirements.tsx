

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    X
} from 'lucide-react';
import { useState } from 'react';

interface ResourcesAndRequirementsProps {
    data: any;
    onDataChange: (data: any) => void;
}

// Predefined equipment categories
const EQUIPMENT_CATEGORIES = {
    'Hardware': [
        'Laptops/Computers',
        'Tablets',
        'Smartphones',
        'Projectors',
        'Interactive Whiteboards',
        'Cameras',
        'Microphones',
        'Speakers',
        'Headphones',
        'VR/AR Equipment'
    ],
    'Software': [
        'Code Editors (VS Code, IntelliJ)',
        'Design Tools (Figma, Adobe Suite)',
        'Collaboration Tools (Slack, Teams)',
        'Video Conferencing (Zoom, Google Meet)',
        'Learning Management System',
        'Cloud Platforms (AWS, Azure, GCP)',
        'Development Tools (Git, Docker)',
        'Analytics Tools'
    ],
    'Materials': [
        'Textbooks',
        'Printed Handouts',
        'Workbooks',
        'Reference Guides',
        'Stationery Supplies',
        'Whiteboards/Markers',
        'Notebooks',
        'Certificates/Badges'
    ],
    'Lab Equipment': [
        'Scientific Instruments',
        'Measuring Tools',
        'Safety Equipment',
        'Specialized Hardware',
        'Testing Equipment',
        'Prototyping Materials'
    ]
};

// Predefined software platforms
const SOFTWARE_PLATFORMS = [
    {
        name: 'Zoom',
        type: 'Video Conferencing',
        link: 'https://zoom.us',
        description: 'Video conferencing and webinar platform'
    },
    {
        name: 'Microsoft Teams',
        type: 'Collaboration',
        link: 'https://teams.microsoft.com',
        description: 'Team collaboration and communication'
    },
    {
        name: 'Google Workspace',
        type: 'Productivity',
        link: 'https://workspace.google.com',
        description: 'Collaborative productivity suite'
    },
    {
        name: 'Slack',
        type: 'Communication',
        link: 'https://slack.com',
        description: 'Team messaging and collaboration'
    },
    {
        name: 'Moodle',
        type: 'LMS',
        link: 'https://moodle.org',
        description: 'Learning management system'
    },
    {
        name: 'Canvas',
        type: 'LMS',
        link: 'https://canvas.instructure.com',
        description: 'Educational technology platform'
    }
];

export function ResourcesAndRequirements({ data, onDataChange }: ResourcesAndRequirementsProps) {
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>(data?.selectedEquipment || []);
    const [selectedSoftware, setSelectedSoftware] = useState<any[]>(data?.selectedSoftware || []);
    const [customEquipment, setCustomEquipment] = useState<string[]>(data?.customEquipment || []);

    const handleEquipmentToggle = (equipment: string, category: string) => {
        const itemWithCategory = `${category}: ${equipment}`;
        const newSelection = selectedEquipment.includes(itemWithCategory)
            ? selectedEquipment.filter(item => item !== itemWithCategory)
            : [...selectedEquipment, itemWithCategory];

        setSelectedEquipment(newSelection);
        onDataChange({ ...data, selectedEquipment: newSelection });
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

    return (
        <div className="space-y-6">
            {/* Materials Needed */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Required Materials & Equipment
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Equipment Categories */}
                    {Object.entries(EQUIPMENT_CATEGORIES).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                            <h4 className="flex items-center gap-2">
                                <Monitor className="w-4 h-4" />
                                {category}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {items.map((item) => {
                                    const itemWithCategory = `${category}: ${item}`;
                                    const isSelected = selectedEquipment.includes(itemWithCategory);
                                    return (
                                        <div key={item} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`${category}-${item}`}
                                                checked={isSelected}
                                                onCheckedChange={() => handleEquipmentToggle(item, category)}
                                            />
                                            <Label htmlFor={`${category}-${item}`} className="text-sm cursor-pointer">
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
                    <div className="space-y-3">
                        <h4>Custom Equipment/Materials</h4>
                        <div className="flex flex-wrap gap-2">
                            {customEquipment.map((equipment) => (
                                <Badge key={equipment} variant="secondary">
                                    {equipment}
                                    <button
                                        onClick={() => removeCustomEquipment(equipment)}
                                        className="ml-2 hover:text-destructive"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Input
                            placeholder="Add custom equipment and press Enter"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    addCustomEquipment((e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }}
                        />
                    </div>

                    {/* Additional Equipment Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="equipmentNotes">Additional Equipment Notes</Label>
                        <Textarea
                            id="equipmentNotes"
                            placeholder="Specify any particular brands, versions, or special requirements for equipment..."
                            rows={3}
                            value={data?.equipmentNotes || ''}
                            onChange={(e) => onDataChange({ ...data, equipmentNotes: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Software/Platform Requirements */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Monitor className="w-5 h-5" />
                        Software/Platform Requirements
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Predefined Software */}
                    <div className="space-y-3">
                        <h4>Recommended Platforms</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SOFTWARE_PLATFORMS.map((software) => {
                                const isSelected = selectedSoftware.find(s => s.name === software.name);
                                return (
                                    <div
                                        key={software.name}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                                            }`}
                                        onClick={() => handleSoftwareToggle(software)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-medium">{software.name}</h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        {software.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {software.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isSelected && <div className="w-2 h-2 bg-primary rounded-full" />}
                                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Software */}
                    <div className="space-y-2">
                        <Label htmlFor="customSoftware">Custom Software/Platform Requirements</Label>
                        <Textarea
                            id="customSoftware"
                            placeholder="List any specific software, applications, or platforms not mentioned above..."
                            rows={3}
                            value={data?.customSoftware || ''}
                            onChange={(e) => onDataChange({ ...data, customSoftware: e.target.value })}
                        />
                    </div>

                    {/* Technical Requirements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="minBandwidth">Minimum Internet Bandwidth</Label>
                            <Select onValueChange={(value) => onDataChange({ ...data, minBandwidth: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select bandwidth requirement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="basic">Basic (1-5 Mbps)</SelectItem>
                                    <SelectItem value="standard">Standard (5-25 Mbps)</SelectItem>
                                    <SelectItem value="high">High (25-100 Mbps)</SelectItem>
                                    <SelectItem value="premium">Premium (100+ Mbps)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deviceRequirements">Device Requirements</Label>
                            <Select onValueChange={(value) => onDataChange({ ...data, deviceRequirements: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select device requirement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any device (mobile-friendly)</SelectItem>
                                    <SelectItem value="tablet-plus">Tablet or larger</SelectItem>
                                    <SelectItem value="laptop-desktop">Laptop/Desktop only</SelectItem>
                                    <SelectItem value="high-spec">High-specification computer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Support Needed */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Support Needed from Institution/Admin
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Support Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { id: 'funding', label: 'Funding Support', icon: DollarSign },
                            { id: 'facilities', label: 'Facilities/Venue', icon: Building },
                            { id: 'marketing', label: 'Marketing/Promotion', icon: Megaphone },
                            { id: 'coordination', label: 'Student Coordination', icon: Users }
                        ].map((support) => {
                            const IconComponent = support.icon;
                            return (
                                <div key={support.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={support.id}
                                        checked={data?.supportNeeded?.includes(support.id) || false}
                                        onCheckedChange={(checked) => {
                                            const current = data?.supportNeeded || [];
                                            const updated = checked
                                                ? [...current, support.id]
                                                : current.filter((s: string) => s !== support.id);
                                            onDataChange({ ...data, supportNeeded: updated });
                                        }}
                                    />
                                    <Label htmlFor={support.id} className="flex items-center gap-2 cursor-pointer">
                                        <IconComponent className="w-4 h-4" />
                                        {support.label}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detailed Support Requirements */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fundingDetails">Funding Requirements</Label>
                            <Textarea
                                id="fundingDetails"
                                placeholder="Describe any funding needed (equipment purchase, venue rental, materials, etc.)"
                                rows={3}
                                value={data?.fundingDetails || ''}
                                onChange={(e) => onDataChange({ ...data, fundingDetails: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="facilitiesDetails">Facilities Requirements</Label>
                            <Textarea
                                id="facilitiesDetails"
                                placeholder="Describe specific venue/facility needs (size, layout, accessibility, etc.)"
                                rows={3}
                                value={data?.facilitiesDetails || ''}
                                onChange={(e) => onDataChange({ ...data, facilitiesDetails: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="marketingSupport">Marketing/Promotion Support</Label>
                            <Textarea
                                id="marketingSupport"
                                placeholder="What marketing support would be helpful? (student outreach, promotional materials, etc.)"
                                rows={3}
                                value={data?.marketingSupport || ''}
                                onChange={(e) => onDataChange({ ...data, marketingSupport: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="administrativeSupport">Administrative Support</Label>
                            <Textarea
                                id="administrativeSupport"
                                placeholder="Any administrative support needed (enrollment management, attendance tracking, certificate issuance, etc.)"
                                rows={3}
                                value={data?.administrativeSupport || ''}
                                onChange={(e) => onDataChange({ ...data, administrativeSupport: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Requirements */}
            <Card>
                <CardHeader>
                    <CardTitle>Additional Requirements & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="accessibilityRequirements">Accessibility Requirements</Label>
                        <Textarea
                            id="accessibilityRequirements"
                            placeholder="Any specific accessibility accommodations needed for inclusive training delivery..."
                            rows={3}
                            value={data?.accessibilityRequirements || ''}
                            onChange={(e) => onDataChange({ ...data, accessibilityRequirements: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="specialRequirements">Special Requirements</Label>
                        <Textarea
                            id="specialRequirements"
                            placeholder="Any other special requirements, constraints, or considerations..."
                            rows={3}
                            value={data?.specialRequirements || ''}
                            onChange={(e) => onDataChange({ ...data, specialRequirements: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="preparationTime">Preparation Time Needed</Label>
                            <Select onValueChange={(value) => onDataChange({ ...data, preparationTime: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="How much prep time do you need?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="minimal">Minimal (1-2 weeks)</SelectItem>
                                    <SelectItem value="standard">Standard (3-4 weeks)</SelectItem>
                                    <SelectItem value="extended">Extended (1-2 months)</SelectItem>
                                    <SelectItem value="comprehensive">Comprehensive (2+ months)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="costEstimate">Estimated Cost Range</Label>
                            <Select onValueChange={(value) => onDataChange({ ...data, costEstimate: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="What's your estimated cost?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free/Pro Bono</SelectItem>
                                    <SelectItem value="low">Low ($1-500)</SelectItem>
                                    <SelectItem value="medium">Medium ($500-2000)</SelectItem>
                                    <SelectItem value="high">High ($2000-5000)</SelectItem>
                                    <SelectItem value="premium">Premium ($5000+)</SelectItem>
                                    <SelectItem value="negotiable">Negotiable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}