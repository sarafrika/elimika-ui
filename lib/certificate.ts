import type { TDocumentDefinitions } from 'pdfmake/interfaces';

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
    pageSize: 'A4',
    pageMargins: [50, 70, 50, 60],
    background: (_, pageSize) => ({
      canvas: [
        // Soft background
        {
          type: 'rect',
          x: 0,
          y: 0,
          w: pageSize.width,
          h: pageSize.height,
          color: '#FDFDFD',
        },
        // Decorative border
        {
          type: 'rect',
          x: 25,
          y: 25,
          w: pageSize.width - 50,
          h: pageSize.height - 50,
          lineWidth: 2,
          lineColor: '#1E3A8A',
          r: 10,
        },
        // Thin inner gold accent border
        {
          type: 'rect',
          x: 35,
          y: 35,
          w: pageSize.width - 70,
          h: pageSize.height - 70,
          lineWidth: 0.8,
          lineColor: '#FACC15',
        },
      ],
    }),

    content: [
      // Title
      {
        text: 'CERTIFICATE OF ACHIEVEMENT',
        alignment: 'center',
        fontSize: 26,
        bold: true,
        color: '#1E3A8A',
        characterSpacing: 1.5,
        margin: [0, 60, 0, 10],
      },
      {
        text: 'This certificate is proudly presented to',
        alignment: 'center',
        fontSize: 13,
        color: '#64748B',
        margin: [0, 0, 0, 20],
      },
      // Recipient Name
      {
        text: studentName,
        alignment: 'center',
        fontSize: 28,
        bold: true,
        color: '#111827',
        margin: [0, 0, 0, 15],
        decoration: 'underline',
        decorationColor: '#E5E7EB',
      },
      {
        text: 'For successfully completing the course',
        alignment: 'center',
        fontSize: 13,
        color: '#64748B',
        margin: [0, 0, 0, 10],
      },
      {
        text: courseTitle,
        alignment: 'center',
        fontSize: 20,
        bold: true,
        color: '#0F172A',
        margin: [0, 0, 0, 25],
      },
      {
        text: `Issued by ${issuer}`,
        alignment: 'center',
        fontSize: 12,
        italics: true,
        color: '#475569',
        margin: [0, 0, 0, 30],
      },

      // Grade + Credits
      {
        alignment: 'center',
        columns: [
          { text: `Grade: ${grade}`, alignment: 'center', fontSize: 11 },
          { text: '•', alignment: 'center', fontSize: 11 },
          { text: `${creditsEarned} Credits`, alignment: 'center', fontSize: 11 },
        ],
        color: '#475569',
        margin: [0, 0, 0, 15],
      },

      // Date
      {
        text: `Date of Completion: ${new Date(completionDate).toLocaleDateString()}`,
        alignment: 'center',
        fontSize: 11,
        color: '#94A3B8',
        margin: [0, 0, 0, 60],
      },

      // Signature
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              { text: signature, alignment: 'center', bold: true, fontSize: 12, color: '#1E3A8A' },
              { text: 'Course Instructor', alignment: 'center', fontSize: 10, color: '#94A3B8' },
            ],
          },
          { width: '*', text: '' },
        ],
        margin: [0, 0, 0, 50],
      },

      // Footer Line
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 0.5,
            lineColor: '#CBD5E1',
          },
        ],
      },

      // Footer Info
      {
        columns: [
          {
            text: `Certificate No: ${certificateNumber}`,
            fontSize: 9,
            color: '#94A3B8',
          },
          {
            text: certificateType,
            fontSize: 9,
            alignment: 'right',
            color: '#94A3B8',
          },
        ],
        margin: [0, 10, 0, 0],
      },
    ],
  };
};
