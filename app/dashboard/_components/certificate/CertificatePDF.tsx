import {
    Document,
    Image,
    Page,
    pdf,
    StyleSheet,
    Text,
    View,
} from "@react-pdf/renderer";

export type CertificateType =
    | "diploma"
    | "degree"
    | "certificate"
    | "certificate-of-completion"
    | "certificate-of-achievement";

export interface CertificateData {
    studentName: string;
    courseName: string;
    institutionName: string;
    certificateType: CertificateType;
    completionDate: string;
    issuedDate?: string;
    certificateId?: string;
    signatoryName?: string;
    signatoryTitle?: string;
    secondSignatoryName?: string;
    secondSignatoryTitle?: string;
    watermarkSrc?: string;
    logoSrc?: string;
    accentColor?: string;
}

const TYPE_COPY: Record<
    CertificateType,
    { headline: string; awardLine: string }
> = {
    diploma: {
        headline: "DIPLOMA",
        awardLine:
            "has completed all requirements for graduation and is hereby awarded this",
    },
    degree: {
        headline: "DEGREE",
        awardLine:
            "has fulfilled all requirements and is hereby conferred the degree of",
    },
    certificate: {
        headline: "CERTIFICATE",
        awardLine:
            "has successfully met all requirements and is hereby awarded this",
    },
    "certificate-of-completion": {
        headline: "CERTIFICATE OF COMPLETION",
        awardLine:
            "has successfully completed the course requirements for",
    },
    "certificate-of-achievement": {
        headline: "CERTIFICATE OF ACHIEVEMENT",
        awardLine:
            "is hereby recognized for outstanding achievement in",
    },
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

function buildStyles(accent: string) {
    return StyleSheet.create({
        page: {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            backgroundColor: "#ffffff",
            position: "relative",
            padding: 60,
        },

        border: {
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            borderWidth: 2,
            borderColor: "#1f2937",
        },

        watermark: {
            position: "absolute",
            top: 0,
            left: 6,
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.06,
        },

        watermarkImg: {
            width: 450,
            height: 450,
        },

        logo: {
            width: 60,
            height: 60,
            position: "absolute",
            top: 32,
            left: 32,
        },

        content: {
            marginTop: 40,
            alignItems: "center",
        },

        headline: {
            fontSize: 36,
            letterSpacing: 3,
            fontWeight: "bold",
            color: "#111827",
            textAlign: "center",
        },

        divider: {
            width: 120,
            borderBottomWidth: 2,
            borderColor: accent,
            marginVertical: 16,
        },

        institution: {
            fontSize: 14,
            letterSpacing: 2,
            color: "#374151",
            marginBottom: 20,
            textAlign: "center",
        },

        presentText: {
            fontSize: 11,
            color: "#6b7280",
            marginBottom: 18,
        },

        name: {
            fontSize: 42,
            fontWeight: "bold",
            color: "#111827",
            marginBottom: 12,
            textAlign: "center",
        },

        awardLine: {
            fontSize: 12,
            color: "#4b5563",
            marginBottom: 10,
            textAlign: "center",
            maxWidth: 520,
        },

        course: {
            fontSize: 18,
            color: accent,
            marginBottom: 14,
            textAlign: "center",
        },

        date: {
            fontSize: 11,
            color: "#6b7280",
            marginTop: 10,
        },

        footer: {
            position: "absolute",
            bottom: 70,
            left: 60,
            right: 60,
            flexDirection: "row",
            justifyContent: "space-between",
        },

        signatureBlock: {
            alignItems: "center",
            width: 180,
        },

        signatureLine: {
            fontSize: 12,
            marginBottom: 6,
            color: "#111827",
        },

        signature: {
            fontSize: 11,
            fontWeight: "bold",
            color: "#111827",
        },

        signatureTitle: {
            fontSize: 9,
            color: "#6b7280",
        },

        certId: {
            position: "absolute",
            bottom: 30,
            width: "100%",
            textAlign: "center",
            fontSize: 8,
            color: "#9ca3af",
            letterSpacing: 1,
        },
    });
}


export const CertificateDocument = (data: CertificateData) => {
    const styles = buildStyles(data.accentColor || "#0061ed");
    const copy = TYPE_COPY[data.certificateType];

    return (
        <Document>
            <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
                {/* Watermark */}
                {data.watermarkSrc && (
                    <View style={styles.watermark}>
                        <Image src={data.watermarkSrc} style={styles.watermarkImg} />
                    </View>
                )}

                {/* Border frame */}
                <View style={styles.border} />

                {/* Logo */}
                {data.logoSrc && <Image src={data.logoSrc} style={styles.logo} />}

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.headline}>{copy.headline}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.institution}>{data.institutionName}</Text>

                    <Text style={styles.presentText}>This is to certify that</Text>

                    <Text style={styles.name}>{data.studentName}</Text>

                    <Text style={styles.awardLine}>{copy.awardLine}</Text>

                    <Text style={styles.course}>{data.courseName}</Text>

                    <Text style={styles.date}>
                        Date of Completion: {data.completionDate}
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLine}>____________________</Text>
                        <Text style={styles.signature}>
                            {data.signatoryName || "Authorized Signatory"}
                        </Text>
                        <Text style={styles.signatureTitle}>
                            {data.signatoryTitle || ""}
                        </Text>
                    </View>

                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLine}>____________________</Text>
                        <Text style={styles.signature}>
                            {data.secondSignatoryName || ""}
                        </Text>
                        <Text style={styles.signatureTitle}>
                            {data.secondSignatoryTitle || ""}
                        </Text>
                    </View>
                </View>

                {/* Certificate ID */}
                {data.certificateId && (
                    <Text style={styles.certId}>
                        Certificate ID: {data.certificateId}
                    </Text>
                )}
            </Page>
        </Document>
    );
};

/** Download helper */
export async function downloadCertificatePdf(data: CertificateData) {
    const blob = await pdf(<CertificateDocument {...data} />).toBlob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.studentName}_certificate.pdf`;
    a.click();

    URL.revokeObjectURL(url);
}