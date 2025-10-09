'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar, DollarSign, Percent, Users } from 'lucide-react';
import { useState } from 'react';

interface CourseLicensingProps {
    data: any;
    onDataChange: (data: any) => void;
}

export function CourseLicensing({ data, onDataChange }: CourseLicensingProps) {
    const [courseType, setCourseType] = useState(data?.courseType || 'free');
    const [priceType, setPriceType] = useState(data?.priceType || 'fixed');
    const [revenueShare, setRevenueShare] = useState(data?.revenueShare || [50]);

    const currencies = [
        { value: 'usd', label: 'USD ($)' },
        { value: 'eur', label: 'EUR (€)' },
        { value: 'gbp', label: 'GBP (£)' },
        { value: 'jpy', label: 'JPY (¥)' },
        { value: 'cad', label: 'CAD ($)' },
        { value: 'aud', label: 'AUD ($)' }
    ];

    const accessPeriods = [
        { value: '1-month', label: '1 Month' },
        { value: '3-months', label: '3 Months' },
        { value: '6-months', label: '6 Months' },
        { value: '1-year', label: '1 Year' },
        { value: 'lifetime', label: 'Lifetime Access' },
        { value: 'custom', label: 'Custom Period' }
    ];

    const handleDataUpdate = (updates: any) => {
        onDataChange({ ...data, ...updates });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3>Course Licensing Structure</h3>
                <p className="text-sm text-muted-foreground">
                    Configure course access, pricing, and enrollment settings
                </p>
            </div>

            {/* Course Limits */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Course Limits
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Course Age Limit</Label>
                            <Select onValueChange={(value) => handleDataUpdate({ ageLimit: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select age limit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-limit">No Age Limit</SelectItem>
                                    <SelectItem value="13+">13+ Years</SelectItem>
                                    <SelectItem value="16+">16+ Years</SelectItem>
                                    <SelectItem value="18+">18+ Years</SelectItem>
                                    <SelectItem value="21+">21+ Years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Course Class Limit</Label>
                            <Input
                                type="number"
                                placeholder="Enter maximum students per class"
                                value={data?.classLimit || ''}
                                onChange={(e) => handleDataUpdate({ classLimit: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Access Period */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Access Period
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>How long will students have access?</Label>
                        <Select onValueChange={(value) => handleDataUpdate({ accessPeriod: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select access period" />
                            </SelectTrigger>
                            <SelectContent>
                                {accessPeriods.map(period => (
                                    <SelectItem key={period.value} value={period.value}>
                                        {period.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {data?.accessPeriod === 'custom' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="number"
                                placeholder="Duration"
                                onChange={(e) => handleDataUpdate({ customDuration: e.target.value })}
                            />
                            <Select onValueChange={(value) => handleDataUpdate({ customUnit: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Time unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="weeks">Weeks</SelectItem>
                                    <SelectItem value="months">Months</SelectItem>
                                    <SelectItem value="years">Years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pricing & Enrollment */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Pricing & Enrollment
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Course Type */}
                    <div className="space-y-3">
                        <Label>Course Type</Label>
                        <RadioGroup
                            value={courseType}
                            onValueChange={(value) => {
                                setCourseType(value);
                                handleDataUpdate({ courseType: value });
                            }}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="free" id="free" />
                                <Label htmlFor="free">Free Course</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="paid" id="paid" />
                                <Label htmlFor="paid">Paid Course</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {courseType === 'paid' && (
                        <>
                            {/* Price Type */}
                            <div className="space-y-3">
                                <Label>Pricing Model</Label>
                                <RadioGroup
                                    value={priceType}
                                    onValueChange={(value) => {
                                        setPriceType(value);
                                        handleDataUpdate({ priceType: value });
                                    }}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="fixed" id="fixed" />
                                        <Label htmlFor="fixed">Fixed Amount</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="revenue-share" id="revenue-share" />
                                        <Label htmlFor="revenue-share">Revenue Share</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {priceType === 'fixed' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Price</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={data?.fixedPrice || ''}
                                            onChange={(e) => handleDataUpdate({ fixedPrice: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Currency</Label>
                                        <Select onValueChange={(value) => handleDataUpdate({ currency: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currencies.map(currency => (
                                                    <SelectItem key={currency.value} value={currency.value}>
                                                        {currency.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {priceType === 'revenue-share' && (
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <Label className="flex items-center gap-2">
                                            <Percent className="w-4 h-4" />
                                            Revenue Split Ratio (Course Author : Instructor/Organization)
                                        </Label>
                                        <div className="px-3">
                                            <Slider
                                                value={revenueShare}
                                                onValueChange={(value) => {
                                                    setRevenueShare(value);
                                                    handleDataUpdate({ revenueShare: value });
                                                }}
                                                max={100}
                                                min={0}
                                                step={5}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                                <span>Course Author: {revenueShare[0]}%</span>
                                                <span>Instructor/Org: {100 - revenueShare[0]}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Minimum Fee (if classes are free)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={data?.minimumFee || ''}
                                                onChange={(e) => handleDataUpdate({ minimumFee: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Currency</Label>
                                            <Select onValueChange={(value) => handleDataUpdate({ minimumFeeCurrency: value })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select currency" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currencies.map(currency => (
                                                        <SelectItem key={currency.value} value={currency.value}>
                                                            {currency.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Discounts & Coupons */}
                            <Card className="bg-muted/20">
                                <CardHeader>
                                    <CardTitle className="text-base">Discounts & Coupons (Optional)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Early Bird Discount (%)</Label>
                                            <Input
                                                type="number"
                                                placeholder="10"
                                                max="100"
                                                value={data?.earlyBirdDiscount || ''}
                                                onChange={(e) => handleDataUpdate({ earlyBirdDiscount: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Bulk Enrollment Discount (%)</Label>
                                            <Input
                                                type="number"
                                                placeholder="15"
                                                max="100"
                                                value={data?.bulkDiscount || ''}
                                                onChange={(e) => handleDataUpdate({ bulkDiscount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Coupon Code</Label>
                                        <Input
                                            placeholder="SAVE20"
                                            value={data?.couponCode || ''}
                                            onChange={(e) => handleDataUpdate({ couponCode: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card className="bg-primary/5">
                <CardHeader>
                    <CardTitle>Pricing Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Course Type:</span>
                            <span className="capitalize">{courseType}</span>
                        </div>
                        {courseType === 'paid' && (
                            <>
                                <div className="flex justify-between">
                                    <span>Pricing Model:</span>
                                    <span className="capitalize">{priceType.replace('-', ' ')}</span>
                                </div>
                                {priceType === 'fixed' && data?.fixedPrice && (
                                    <div className="flex justify-between">
                                        <span>Price:</span>
                                        <span>
                                            {data.fixedPrice} {data?.currency?.toUpperCase() || 'USD'}
                                        </span>
                                    </div>
                                )}
                                {priceType === 'revenue-share' && (
                                    <div className="flex justify-between">
                                        <span>Revenue Split:</span>
                                        <span>
                                            {revenueShare[0]}% / {100 - revenueShare[0]}%
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex justify-between">
                            <span>Access Period:</span>
                            <span>
                                {data?.accessPeriod ?
                                    accessPeriods.find(p => p.value === data.accessPeriod)?.label || data.accessPeriod
                                    : 'Not set'
                                }
                            </span>
                        </div>
                        {data?.classLimit && (
                            <div className="flex justify-between">
                                <span>Class Limit:</span>
                                <span>{data.classLimit} students</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}