"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { CertificateData, CertificateDocument } from "./CertificatePDF";


export default function CertificatePage({ certData }: { certData: CertificateData }) {
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