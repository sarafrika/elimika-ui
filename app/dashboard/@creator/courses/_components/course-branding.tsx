'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Upload, Video, X } from 'lucide-react';
import { useState } from 'react';

interface CourseBrandingProps {
    data: any;
    onDataChange: (data: any) => void;
}

export function CourseBranding({ data, onDataChange }: CourseBrandingProps) {
    const [coverImage, setCoverImage] = useState(data?.coverImage || null);
    const [promoVideo, setPromoVideo] = useState(data?.promoVideo || null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // In a real app, you would upload to a server
            const imageUrl = URL.createObjectURL(file);
            setCoverImage({ file, url: imageUrl, name: file.name });
            onDataChange({ ...data, coverImage: { file, url: imageUrl, name: file.name } });
        }
    };

    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // In a real app, you would upload to a server
            const videoUrl = URL.createObjectURL(file);
            setPromoVideo({ file, url: videoUrl, name: file.name });
            onDataChange({ ...data, promoVideo: { file, url: videoUrl, name: file.name } });
        }
    };

    const handleVideoUrlChange = (url: string) => {
        if (url) {
            setPromoVideo({ url, name: 'External Video' });
            onDataChange({ ...data, promoVideo: { url, name: 'External Video' } });
        }
    };

    const removeCoverImage = () => {
        setCoverImage(null);
        onDataChange({ ...data, coverImage: null });
    };

    const removePromoVideo = () => {
        setPromoVideo(null);
        onDataChange({ ...data, promoVideo: null });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3>Course Branding</h3>
                <p className="text-sm text-muted-foreground">
                    Add visual elements to make your course more appealing
                </p>
            </div>

            {/* Cover Image */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        Cover Image/Thumbnail
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {coverImage ? (
                        <div className="relative">
                            <img
                                src={coverImage.url}
                                alt="Course cover"
                                className="w-full max-w-md h-48 object-cover rounded-lg border"
                            />
                            <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={removeCoverImage}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <div className="mt-2 text-sm text-muted-foreground">
                                {coverImage.name}
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                            <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                            <h4 className="mb-2">Upload Cover Image</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Recommended: 1280x720px (16:9 ratio), JPG or PNG format
                            </p>
                            <Label htmlFor="cover-upload" className="cursor-pointer">
                                <Button variant="outline" asChild>
                                    <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Choose Image
                                    </span>
                                </Button>
                            </Label>
                            <Input
                                id="cover-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Promo Video */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Promotional Video
                        <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {promoVideo ? (
                        <div className="space-y-3">
                            {promoVideo.file ? (
                                <video
                                    src={promoVideo.url}
                                    controls
                                    className="w-full max-w-md h-48 rounded-lg border"
                                />
                            ) : (
                                <div className="w-full max-w-md h-48 bg-muted rounded-lg border flex items-center justify-center">
                                    <div className="text-center">
                                        <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                        <p className="text-sm">External Video Link</p>
                                        <p className="text-xs text-muted-foreground">{promoVideo.url}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{promoVideo.name}</span>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={removePromoVideo}
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Upload Video */}
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                                <Video className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                                <h4 className="mb-2">Upload Promotional Video</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Keep it under 2 minutes. MP4 format recommended.
                                </p>
                                <Label htmlFor="video-upload" className="cursor-pointer">
                                    <Button variant="outline" asChild>
                                        <span>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Choose Video File
                                        </span>
                                    </Button>
                                </Label>
                                <Input
                                    id="video-upload"
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={handleVideoUpload}
                                />
                            </div>

                            {/* Or Video URL */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Video URL</Label>
                                <Input
                                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Supports YouTube, Vimeo, and other video platforms
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Course Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Course Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg p-4 bg-muted/20">
                        <div className="flex gap-4">
                            <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                                {coverImage ? (
                                    <img
                                        src={coverImage.url}
                                        alt="Course cover"
                                        className="w-full h-full object-cover rounded"
                                    />
                                ) : (
                                    <Image className="w-8 h-8 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4>{data?.title || 'Course Title'}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {data?.subtitle || 'Course subtitle will appear here'}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    {promoVideo && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                            Has Video
                                        </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {data?.category || 'Category'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}