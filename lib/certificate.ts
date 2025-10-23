import { TDocumentDefinitions } from "pdfmake/interfaces";

export interface CertificateData {
    uuid: string;
    id: string;
    studentName: string;
    courseTitle: string;
    issuer: string;
    grade: string;
    creditsEarned: number;
    completionDate: string;
    signature: string;
    certificateNumber: string;
    certificateType: string;
    certificateUrl?: string;
}

export const certificatePDF = (certificate: CertificateData): TDocumentDefinitions => {
    const {
        studentName,
        courseTitle,
        issuer,
        grade,
        creditsEarned,
        completionDate,
        signature,
        certificateNumber,
        certificateType,
    } = certificate;

    return {
        pageSize: "A4",
        pageMargins: [40, 60, 40, 60],
        background: function (_, pageSize) {
            return {
                canvas: [
                    {
                        type: "rect",
                        x: 0,
                        y: 0,
                        w: pageSize.width,
                        h: pageSize.height,
                        color: "#f9fafb", // light background
                    },
                    {
                        type: "rect",
                        x: 25,
                        y: 25,
                        w: pageSize.width - 50,
                        h: pageSize.height - 50,
                        lineWidth: 2,
                        lineColor: "#0F172A",
                    },
                ],
            };
        },
        // defaultStyle: { font: "Rubik", color: "#FFFFFF" },
        content: [
            {
                text: "Certificate of Achievement",
                alignment: "center",
                fontSize: 24,
                bold: true,
                color: "#1E3A8A",
                margin: [0, 40, 0, 10],
            },
            {
                text: "This certifies that",
                alignment: "center",
                fontSize: 12,
                color: "#64748B",
                margin: [0, 0, 0, 10],
            },
            {
                text: studentName,
                alignment: "center",
                fontSize: 20,
                bold: true,
                margin: [0, 0, 0, 8],
            },
            {
                text: "has successfully completed",
                alignment: "center",
                fontSize: 12,
                color: "#64748B",
                margin: [0, 0, 0, 10],
            },
            {
                text: courseTitle,
                alignment: "center",
                fontSize: 18,
                bold: true,
                color: "#0F172A",
                margin: [0, 0, 0, 4],
            },
            {
                text: issuer,
                alignment: "center",
                fontSize: 12,
                color: "#64748B",
                margin: [0, 0, 0, 25],
            },
            {
                alignment: "center",
                columns: [
                    { text: `Grade: ${grade}`, alignment: "center", fontSize: 10 },
                    { text: "•", alignment: "center", fontSize: 10 },
                    { text: `${creditsEarned} Credits`, alignment: "center", fontSize: 10 },
                ],
                margin: [0, 0, 0, 10],
                color: "#475569",
            },
            {
                text: `Completed: ${new Date(completionDate).toLocaleDateString()}`,
                alignment: "center",
                fontSize: 10,
                color: "#94A3B8",
                margin: [0, 0, 0, 50],
            },
            {
                columns: [
                    {
                        width: "*",
                        text: "",
                    },
                    {
                        width: "auto",
                        stack: [
                            { text: signature, alignment: "center", bold: true, fontSize: 10 },
                            { text: "Course Instructor", alignment: "center", fontSize: 9, color: "#94A3B8" },
                        ],
                    },
                    {
                        width: "*",
                        text: "",
                    },
                ],
                margin: [0, 0, 0, 40],
            },
            {
                canvas: [
                    {
                        type: "line",
                        x1: 0,
                        y1: 5,
                        x2: 515,
                        y2: 5,
                        lineWidth: 0.5,
                        lineColor: "#CBD5E1",
                    },
                ],
            },
            {
                columns: [
                    {
                        text: `Certificate No: ${certificateNumber}`,
                        fontSize: 9,
                        color: "#94A3B8",
                    },
                    {
                        text: certificateType,
                        fontSize: 9,
                        alignment: "right",
                        color: "#94A3B8",
                    },
                ],
                margin: [0, 10, 0, 0],
            },
        ],
    };
};
