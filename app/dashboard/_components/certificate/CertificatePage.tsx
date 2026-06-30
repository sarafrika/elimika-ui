"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { CertificateData, CertificateDocument } from "./CertificatePDF";



export default function CertificatePage() {
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
        accentColor: "#0061ed",
    };

    return (
        <div className="p-6 space-y-6">
            {/* Preview */}
            <PDFViewer style={{ width: "100%", height: 720, border: "none" }}>
                <CertificateDocument {...certData} />
            </PDFViewer>

            {/* Actions */}
            {/* <div className="flex gap-4">
                <PDFDownloadLink
                    document={<CertificateDocument {...certData} />}
                    fileName={`${certData.studentName}_certificate.pdf`}
                    className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
                >
                    {({ loading }) =>
                        loading ? "Preparing certificate..." : "Download PDF"
                    }
                </PDFDownloadLink>

                <button
                    onClick={() => downloadCertificatePdf(certData)}
                    className="rounded-md border border-border px-4 py-2"
                >
                    Quick Download
                </button>
            </div> */}
        </div>
    );
}