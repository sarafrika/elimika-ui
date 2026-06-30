import CertificatePage from '../../../_components/certificate/CertificatePage';
import { CertificateData } from '../../../_components/certificate/CertificatePDF';

const StudentCertificatePage = () => {
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