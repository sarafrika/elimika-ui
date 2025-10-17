'use client';

import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { getInstructorDocumentsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

interface Certificate {
    id: number;
    name: string;
    fileUrl: string;
}

export default function CertificatesPage() {
    const instructor = useInstructor()
    const { replaceBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        replaceBreadcrumbs([
            { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
            {
                id: 'certifciates',
                title: 'Certifciates',
                url: '/dashboard/profile/certifciates',
                isLast: true,
            },
        ]);
    }, [replaceBreadcrumbs]);

    const { data: documents, isLoading, isFetching } = useQuery({
        ...getInstructorDocumentsOptions({ path: { instructorUuid: instructor?.uuid as string } }),
        enabled: !!instructor?.uuid
    })
    const loading = isLoading || isFetching

    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const uploadedFile = files[0];
        const fileUrl = URL.createObjectURL(uploadedFile as any);

        const newCertificate: Certificate = {
            id: Date.now(),
            name: uploadedFile?.name as any,
            fileUrl,
        };

        setCertificates((prev) => [...prev, newCertificate]);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className='space-y-6 mx-auto'>
            <div>
                <h1 className='text-2xl font-semibold'>Certificates</h1>
                <p className='text-muted-foreground text-sm'>
                    Upload and manage your professional certificates.
                </p>
            </div>

            <div className="border-1 border-dashed border-gray-300 rounded-md p-6 text-center hover:bg-gray-50 transition">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUpload}
                    className="mx-auto block text-sm text-gray-600
      file:mr-4 file:py-2 file:px-4
      file:rounded file:border-0
      file:text-sm file:font-semibold
      file:bg-blue-50 file:text-blue-700
      hover:file:bg-blue-100"
                />
                <p className="mt-2 text-sm text-gray-500">Upload PDF or image files</p>
            </div>


            <div>
                <h2 className='text-lg font-medium mb-2'>Uploaded Certificates</h2>

                {loading && <div><Spinner /></div>}

                {!loading && certificates.length === 0 ? (
                    <p className='text-sm text-gray-500'>No certificates uploaded yet.</p>
                ) : (
                    <ul className='space-y-3'>
                        {certificates.map((cert) => (
                            <li key={cert.id} className='border p-4 rounded-md bg-gray-50'>
                                <p className='font-medium'>{cert.name}</p>
                                <a
                                    href={cert.fileUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-blue-600 text-sm underline'
                                >
                                    View
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
