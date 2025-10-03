'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { ChevronLeft, DollarSign, Globe, Lock, Users } from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Label } from '../../../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../../../components/ui/radio-group';
import { Switch } from '../../../../../components/ui/switch';

interface VisibilityFormProps {
    data: Partial<any>;
    onUpdate: (updates: Partial<any>) => void;
    onNext: () => void;
    onPrev: () => void;
}

const visibilitySchema = z.object({
    publicity: z.enum(['public', 'private']),
    enrollmentLimit: z.number().min(1, 'Enrollment limit must be greater than 0'),
    isFree: z.boolean(),
    price: z.number().min(0, 'Price must be 0 or more'),
});

type VisibilityFormValues = z.infer<typeof visibilitySchema>;

export function VisibilityForm({
    data,
    onUpdate,
    onNext,
    onPrev,
}: VisibilityFormProps) {
    const form = useForm<VisibilityFormValues>({
        resolver: zodResolver(visibilitySchema),
        mode: 'onBlur',
        defaultValues: {
            publicity: 'public',
            enrollmentLimit: data?.max_participants as any,
            isFree: true,
            price: 0,
        },
    });

    const watchIsFree = form.watch('isFree') ?? true;
    const watchPrice = form.watch('price') ?? 0;

    const totalLessons =
        data?.schedule?.skills?.reduce(
            (acc: any, skill: any) => acc + skill.lessons.length,
            0
        ) || 0;

    const calculateTotalFee = () => {
        if (watchIsFree) return 0;
        return watchPrice * totalLessons;
    };


    const handleSubmit = (values: VisibilityFormValues) => {
        onNext();
        // console.log(values, "submitted values")
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
            >
                {/* Publicity */}
                <FormField
                    control={form.control}
                    name="publicity"
                    render={({ field }) => (
                        <FormItem className="space-y-4">
                            <FormLabel>Class Publicity</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    className="space-y-4"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className="flex items-start space-x-3">
                                            <RadioGroupItem value="public" id="public" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-green-600" />
                                                    <Label htmlFor="public" className="font-medium">
                                                        Public
                                                    </Label>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Anyone can discover and enroll in this class
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                        <div className="flex items-start space-x-3">
                                            <RadioGroupItem value="private" id="private" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Lock className="w-4 h-4 text-blue-600" />
                                                    <Label htmlFor="private" className="font-medium">
                                                        Private
                                                    </Label>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Invite only - accessible via code or registration link
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                {/* Enrollment Limit */}
                <FormField
                    control={form.control}
                    name="enrollmentLimit"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Enrollment Limit *</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        min={1}
                                        max={1000}
                                        className="max-w-32"
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        students maximum
                                    </span>
                                </div>
                            </FormControl>
                            <FormMessage />
                            <FormDescription>
                                Auto-filled from Course License settings
                            </FormDescription>
                        </FormItem>
                    )}
                />

                {/* Pricing Section */}
                <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Pricing</FormLabel>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="free-toggle" className="text-sm">
                                        Free Class
                                    </Label>
                                    <Switch
                                        id="free-toggle"
                                        checked={field.value as boolean}
                                        onCheckedChange={(val: any) => {
                                            field.onChange(val);
                                            if (val) form.setValue('price', 0);
                                        }}
                                    />
                                </div>
                            </div>
                        </FormItem>
                    )}
                />

                {!watchIsFree && (
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel>Rate per Lesson *</FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) =>
                                                field.onChange(parseFloat(e.target.value) || 0)
                                            }
                                            step="0.01"
                                            className="max-w-32"
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            per lesson
                                        </span>
                                    </div>
                                </FormControl>
                                <FormMessage />
                                <FormDescription>
                                    From instructor&apos;s availability settings
                                </FormDescription>

                                {/* Pricing Summary */}
                                <Card className="bg-gray-50 mt-4">
                                    <CardContent className="p-4">
                                        <h4 className="font-medium mb-2">Pricing Summary</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Rate per lesson:</span>
                                                <span>${watchPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Total lessons:</span>
                                                <span>{totalLessons}</span>
                                            </div>
                                            <div className="border-t pt-2 flex justify-between font-medium">
                                                <span>Total fee:</span>
                                                <span>${calculateTotalFee().toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </FormItem>
                        )}
                    />
                )}

                {watchIsFree && (
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-green-800">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-medium">Free Class</span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                                Students can enroll without any payment
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Access Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Visibility:</span>
                            <div className="font-medium capitalize flex items-center gap-1">
                                {form.getValues('publicity') === 'public' ? (
                                    <Globe className="w-3 h-3 text-green-600" />
                                ) : (
                                    <Lock className="w-3 h-3 text-blue-600" />
                                )}
                                {form.getValues('publicity')}
                            </div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Max Students:</span>
                            <div className="font-medium">
                                {form.getValues('enrollmentLimit')}
                            </div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Price Type:</span>
                            <div className="font-medium">
                                {form.getValues('isFree') ? 'Free' : 'Paid'}
                            </div>
                        </div>
                        {!watchIsFree && (
                            <div>
                                <span className="text-muted-foreground">Total Cost:</span>
                                <div className="font-medium">
                                    ${calculateTotalFee().toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-between">
                    <Button variant="outline" onClick={onPrev} type="button" className="gap-2">
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </Button>
                    <Button type="submit">Next: Resources</Button>
                </div>
            </form>
        </Form>
    );
}
