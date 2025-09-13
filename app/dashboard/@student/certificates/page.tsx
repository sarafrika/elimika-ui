'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useStudent } from '@/context/student-context';
import { getStudentCertificatesOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { EyeIcon, MoreVertical, Star, TrashIcon } from 'lucide-react';
import Link from 'next/link';

const certificates = [
  {
    "uuid": "c1e2r3t4-5i6f-7i8c-9a10-abcdefghijkl",
    "certificate_number": "CERT-2024-JAV-001234",
    "student_uuid": "s1t2u3d4-5e6n-7t8u-9s10-abcdefghijkl",
    "course_uuid": "c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl",
    "program_uuid": null,
    "template_uuid": "t1e2m3p4-5l6a-7t8e-9u10-abcdefghijkl",
    "issued_date": "2024-05-15T16:30:00",
    "completion_date": "2024-05-15T15:45:00",
    "final_grade": 87.5,
    "certificate_url": "https://cdn.sarafrika.com/certificates/CERT-2024-JAV-001234.pdf",
    "is_valid": true,
    "revoked_at": null,
    "revoked_reason": null,
    "created_date": "2024-05-15T16:30:00",
    "created_by": "system",
    "updated_date": "2024-05-15T16:30:00",
    "updated_by": "system",
    "certificate_type": "Course Completion",
    "grade_letter": "B+",
    "is_downloadable": true,
    "validity_status": "Valid Certificate"
  },
  {
    "uuid": "c1e2r3t4-5i6f-7i8c-9a10-abcdefghkjkl",
    "certificate_number": "CERT-2024-JAV-001234",
    "student_uuid": "s1t2u3d4-5e6n-7t8u-9s10-abcdefghijkl",
    "course_uuid": "c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl",
    "program_uuid": null,
    "template_uuid": "t1e2m3p4-5l6a-7t8e-9u10-abcdefghijkl",
    "issued_date": "2024-05-15T16:30:00",
    "completion_date": "2024-05-15T15:45:00",
    "final_grade": 87.5,
    "certificate_url": "https://cdn.sarafrika.com/certificates/CERT-2024-JAV-001234.pdf",
    "is_valid": true,
    "revoked_at": null,
    "revoked_reason": null,
    "created_date": "2024-05-15T16:30:00",
    "created_by": "system",
    "updated_date": "2024-05-15T16:30:00",
    "updated_by": "system",
    "certificate_type": "Course Completion",
    "grade_letter": "B+",
    "is_downloadable": true,
    "validity_status": "Valid Certificate"
  },
  {
    "uuid": "c1e2r3t4-5i6f-7i8c-9a10-abcdefghkjkl",
    "certificate_number": "CERT-2024-JAV-001234",
    "student_uuid": "s1t2u3d4-5e6n-7t8u-9s10-abcdefghijkl",
    "course_uuid": "c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl",
    "program_uuid": null,
    "template_uuid": "t1e2m3p4-5l6a-7t8e-9u10-abcdefghijkl",
    "issued_date": "2024-05-15T16:30:00",
    "completion_date": "2024-05-15T15:45:00",
    "final_grade": 87.5,
    "certificate_url": "https://cdn.sarafrika.com/certificates/CERT-2024-JAV-001234.pdf",
    "is_valid": true,
    "revoked_at": null,
    "revoked_reason": null,
    "created_date": "2024-05-15T16:30:00",
    "created_by": "system",
    "updated_date": "2024-05-15T16:30:00",
    "updated_by": "system",
    "certificate_type": "Course Completion",
    "grade_letter": "B+",
    "is_downloadable": true,
    "validity_status": "Valid Certificate"
  },
  {
    "uuid": "c1e2r3t4-5i6f-7i8c-9a10-abcdefghkjkl",
    "certificate_number": "CERT-2024-JAV-001234",
    "student_uuid": "s1t2u3d4-5e6n-7t8u-9s10-abcdefghijkl",
    "course_uuid": "c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl",
    "program_uuid": null,
    "template_uuid": "t1e2m3p4-5l6a-7t8e-9u10-abcdefghijkl",
    "issued_date": "2024-05-15T16:30:00",
    "completion_date": "2024-05-15T15:45:00",
    "final_grade": 87.5,
    "certificate_url": "https://cdn.sarafrika.com/certificates/CERT-2024-JAV-001234.pdf",
    "is_valid": true,
    "revoked_at": null,
    "revoked_reason": null,
    "created_date": "2024-05-15T16:30:00",
    "created_by": "system",
    "updated_date": "2024-05-15T16:30:00",
    "updated_by": "system",
    "certificate_type": "Course Completion",
    "grade_letter": "B+",
    "is_downloadable": true,
    "validity_status": "Valid Certificate"
  },
  {
    "uuid": "c1e2r3t4-5i6f-7i8c-9a10-abcdefghkjkl",
    "certificate_number": "CERT-2024-JAV-001234",
    "student_uuid": "s1t2u3d4-5e6n-7t8u-9s10-abcdefghijkl",
    "course_uuid": "c1o2u3r4-5s6e-7d8a-9t10-abcdefghijkl",
    "program_uuid": null,
    "template_uuid": "t1e2m3p4-5l6a-7t8e-9u10-abcdefghijkl",
    "issued_date": "2024-05-15T16:30:00",
    "completion_date": "2024-05-15T15:45:00",
    "final_grade": 87.5,
    "certificate_url": "https://cdn.sarafrika.com/certificates/CERT-2024-JAV-001234.pdf",
    "is_valid": true,
    "revoked_at": null,
    "revoked_reason": null,
    "created_date": "2024-05-15T16:30:00",
    "created_by": "system",
    "updated_date": "2024-05-15T16:30:00",
    "updated_by": "system",
    "certificate_type": "Course Completion",
    "grade_letter": "B+",
    "is_downloadable": true,
    "validity_status": "Valid Certificate"
  }
]

export default function CertificatesPage() {
  const student = useStudent();

  const {
    data,
    isLoading,
    isError,
  } = useQuery(
    getStudentCertificatesOptions({ path: { studentUuid: student?.uuid as string } })
  );

  // const certificates = data?.data ?? [];

  return (
    <div className="space-y-6">
      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 text-gray-600 border border-dashed border-gray-300 py-12 rounded-md text-center">
          <Star size={18} />
          <p>No certificates found yet.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {certificates.map((cert) => (
            <div
              key={cert.uuid}
              className='relative min-h-[250px] rounded-lg border bg-white p-5 shadow-sm transition hover:shadow-md'
            >
              <div className='absolute top-2 right-2'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' aria-label='Open menu'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/certificates/${cert.uuid}`}
                        className='flex w-full items-center'
                      >
                        <EyeIcon className='mr-2 h-4 w-4' />
                        Preview
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                    // onClick={() => openDeleteModal(cl.uuid)}
                    >
                      <TrashIcon className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <h2 className="font-semibold text-lg mb-1">{cert.certificate_type}</h2>
                <p className="text-sm text-gray-600 mb-2">
                  Issued on: {new Date(cert.issued_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mb-2">Final Grade: {cert.final_grade} ({cert.grade_letter})</p>
                <p className="text-sm text-gray-600 mb-4">Status: {cert.validity_status}</p>

                {cert.is_downloadable && cert.certificate_url ? (
                  <Link
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Certificate
                  </Link>
                ) : (
                  <p className="text-sm text-red-500">Not available for download</p>
                )}
              </div>
            </div>



          ))}
        </div>
      )}
    </div>
  );
}
