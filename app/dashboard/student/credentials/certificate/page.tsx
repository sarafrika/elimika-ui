'use client'

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useCoursesByIds } from '../../../../../hooks/use-batched-lookups';
import { getAllCertificatesOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import CertificatePage from '../../../_components/certificate/CertificatePage';
import { CertificateData } from '../../../_components/certificate/CertificatePDF';

const StudentCertificatePage = () => {
    const searchParams = useSearchParams();
    const studentUuid = searchParams.get('csid');
    const courseUuid = searchParams.get('ccid')
    const classUuid = searchParams.get('clid')

    const { courseMap } = useCoursesByIds([courseUuid as string])
    const { data: certificatesData, isLoading } = useQuery({
        ...getAllCertificatesOptions({
            query: {
                pageable: {},
            },
        }),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const certData: CertificateData = {
        studentName: "John Doe",
        courseName: "React Fundamentals",
        institutionName: "SkillBridge Academy",
        certificateType: "certificate-of-completion",
        completionDate: "January 1st 2027",
        certificateId: "SBA-2027-000123",
        signatoryName: "Joy Adebayo",
        signatoryTitle: "Program Director",
        watermarkSrc: "/assets/watermark.png",
        logoSrc: "/assets/logo.png",
        accentColor: "primary",
    };

    return (
        <div>
            <CertificatePage certData={certData} />
        </div>
    )
}

export default StudentCertificatePage