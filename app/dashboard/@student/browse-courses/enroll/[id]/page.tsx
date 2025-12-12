'use client';

import ConfirmModal from '@/components/custom-modals/confirm-modal';
import { Card } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useBundledClassInfo from '@/hooks/use-course-classes';
import {
  completeCartMutation,
  enrollStudentMutation,
  getCartOptions,
  getStudentScheduleQueryKey,
  listCatalogItemsOptions,
  selectPaymentSessionMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addYears, format } from 'date-fns';
import { ShoppingCart } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
import { Label } from '../../../../../../components/ui/label';
import { CustomLoadingState } from '../../../../@course_creator/_components/loading-state';
import EnrollCourseCard from '../../../../_components/enroll-course-card';

const EnrollmentPage = () => {
  const params = useParams();
  const courseId = params?.id as string;

  const { replaceBreadcrumbs } = useBreadcrumb();
  const student = useStudent();
  const qc = useQueryClient();

  const [openEnrollModal, setOpenEnrollModal] = useState(false);
  const [enrollingClass, setEnrollingClass] = useState<any | null>(null);

  useEffect(() => {
    if (courseId) {
      replaceBreadcrumbs([
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        { id: 'courses', title: 'Browse Courses', url: `/dashboard/browse-courses` },
        { id: 'course-details', title: `Enroll`, url: `/dashboard/browse-courses/enroll/${courseId}` },
      ]);
    }
  }, [replaceBreadcrumbs, courseId]);

  // --- Date filter: default to a 1-year span, but classes won't load until user clicks Apply
  const today = new Date();
  const defaultStartDate = today;
  const defaultEndDate = addYears(today, 1);

  const toInputDate = (d: Date) => d.toISOString().slice(0, 10);
  const [startDateInput, setStartDateInput] = useState<string>(toInputDate(defaultStartDate));
  const [endDateInput, setEndDateInput] = useState<string>(toInputDate(defaultEndDate));

  const [appliedStart, setAppliedStart] = useState<string | null>(null);
  const [appliedEnd, setAppliedEnd] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const applyDates = () => {
    setDateError(null);
    if (!startDateInput || !endDateInput) {
      setDateError('Please select both start and end dates.');
      return;
    }
    const s = new Date(startDateInput);
    const e = new Date(endDateInput);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      setDateError('Invalid date format.');
      return;
    }
    if (s > e) {
      setDateError('Start date must be before end date.');
      return;
    }
    setAppliedStart(startDateInput);
    setAppliedEnd(endDateInput);
  };

  const clearDates = () => {
    setStartDateInput(toInputDate(defaultStartDate));
    setEndDateInput(toInputDate(defaultEndDate));
    setAppliedStart(null);
    setAppliedEnd(null);
    setDateError(null);
  };

  const { data: catalogues } = useQuery(listCatalogItemsOptions())
  const { classes = [], loading, isError } = useBundledClassInfo(
    courseId,
    appliedStart ?? undefined,
    appliedEnd ?? undefined,
    student
  );


  const filteredClasses = classes.filter(cls =>
    catalogues?.data?.some(cat => cat.class_definition_uuid === cls.uuid)
  );

  const { formattedStart, formattedEnd } = useMemo(() => {
    if (!enrollingClass) {
      return { formattedStart: '', formattedEnd: '' };
    }

    try {
      const start = enrollingClass?.default_start_time
        ? new Date(enrollingClass.default_start_time)
        : null;
      const end = enrollingClass?.default_end_time
        ? new Date(enrollingClass.default_end_time)
        : null;

      return {
        formattedStart: start ? format(start, 'MMM dd, yyyy • hh:mm a') : 'N/A',
        formattedEnd: end ? format(end, 'MMM dd, yyyy • hh:mm a') : 'N/A',
      };
    } catch (e) {
      return { formattedStart: 'N/A', formattedEnd: 'N/A' };
    }
  }, [enrollingClass]);

  const enrollStudent = useMutation(enrollStudentMutation());
  const handleEnrollStudent = () => {
    if (!student?.uuid) return toast.error('Student not found');
    if (!enrollingClass?.uuid) return toast.error('Class not found');

    enrollStudent.mutate(
      {
        body: {
          class_definition_uuid: enrollingClass.uuid,
          student_uuid: student.uuid,
        },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getStudentScheduleQueryKey({
              path: { studentUuid: student.uuid as string },
              query: {
                start: new Date('2025-11-02'),
                end: new Date('2026-12-19'),
              },
            }),
          });

          setOpenEnrollModal(false);
          toast.success(data?.message || 'Student enrolled successfully');
        },
        onError: err => {
          // @ts-expect-error
          toast.error(err?.error || 'Failed to enroll');
          setOpenEnrollModal(false);
        },
      }
    );
  };

  const savedCartId = localStorage.getItem("cart_id");
  const [openCartModal, setOpenCartModal] = useState(false);

  const { data: cartData } = useQuery(getCartOptions({ path: { cartId: savedCartId as string } }))
  // @ts-ignore
  const cart = cartData?.data

  const cartPaymentSession = useMutation(selectPaymentSessionMutation())
  const handlePaymentSession = (cart: any) => {
    cartPaymentSession.mutate({
      path: { cartId: cart.id },
      body: { provider_id: "manual" }
    }, {
      onSuccess: (data) => {
        toast.success("Redirecting to payment…"),
          setOpenCartModal(false)
      }
    })
  }

  const completeCart = useMutation(completeCartMutation())
  const handleCompleteCart = () => [
    completeCart.mutate({
      path: { cartId: savedCartId as string }
    },
      {
        onSuccess: (data: any) => {
          toast.success("Success")
        },
        onError: (error: any) => {
          toast.error(error?.message)
        }
      })
  ]

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Explore Classes Open for Enrollment</h1>
          <p className="text-muted-foreground">
            Discover courses designed to help you grow and succeed.
          </p>
        </div>

        <div
          className="relative cursor-pointer"
          onClick={() => setOpenCartModal(true)}
        >
          <ShoppingCart />
          <span className="absolute -top-2.5 -right-2.5 flex items-center justify-center 
    bg-destructive text-white text-xs font-bold w-5 h-5 rounded-full">
            {cart?.items.length}
          </span>
        </div>
      </div>

      {/* Date filter controls */}
      <Card className="p-4 flex flex-col md:flex-row items-start md:items-end gap-3">
        <div className="flex items-center justify-center gap-3 w-full md:w-auto">
          <div>
            <Label className="text-xs">Start</Label>
            <Input
              type="date"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">End</Label>
            <Input
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button size="sm" onClick={applyDates}>Apply</Button>
            <Button size="sm" variant="outline" onClick={clearDates}>Reset</Button>
          </div>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {!appliedStart || !appliedEnd ? (
            <span>Please apply a date range to load classes (defaults shown).</span>
          ) : (
            <span>Showing classes from <strong>{format(new Date(appliedStart), 'MMM dd, yyyy')}</strong> to <strong>{format(new Date(appliedEnd), 'MMM dd, yyyy')}</strong></span>
          )}
        </div>

        {dateError && <div className="w-full text-sm text-destructive mt-2 md:mt-0">{dateError}</div>}
      </Card>

      <div className='cursor-pointer' onClick={handleCompleteCart} >
        <span>Complete current cart</span>
      </div>


      {loading ?
        <CustomLoadingState subHeading="Loading available classes..." />
        : <>
          {(!appliedStart || !appliedEnd) ? (
            <Card className="flex flex-col items-center justify-center space-y-2 p-6 text-center text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Select a date range</h3>
              <p className="text-sm text-muted-foreground">
                Choose a start and end date then click Apply to view available classes.
              </p>
            </Card>
          ) :
            classes.length === 0 ? (
              <Card className="flex flex-col items-center justify-center space-y-2 p-6 text-center text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10m-9 4h4m-8 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-foreground">No Classes Available</h3>
                <p className="text-sm text-muted-foreground">
                  It looks like this course doesn’t have any classes yet.
                </p>
              </Card>
            ) : (
              <div className="flex flex-row flex-wrap gap-4">
                {filteredClasses.map(cls => (
                  <EnrollCourseCard
                    key={cls?.uuid}
                    href="#"
                    cls={cls}
                    isFull={false}
                    disableEnroll={false}
                    handleEnroll={() => {
                      setEnrollingClass(cls);
                      setOpenEnrollModal(true);
                    }}
                    variant="full"
                  />
                ))}
              </div>
            )}</>}



      <ConfirmModal
        open={openEnrollModal}
        setOpen={setOpenEnrollModal}
        title="Confirm Enrollment"
        description={
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>You are about to <strong>enroll</strong> in the following class/program:</p>

            <div className="rounded-md border bg-muted/60 p-3">
              <p><strong>Course Name:</strong> {enrollingClass?.course?.name || 'N/A'}</p>
              <p><strong>Instructor:</strong> {enrollingClass?.instructor?.full_name || 'N/A'}</p>
              <p><strong>Start Date:</strong> {formattedStart}</p>
              <p><strong>End Date:</strong> {formattedEnd}</p>
              {enrollingClass?.location_type && (
                <p><strong>Location:</strong> {enrollingClass.location_type}</p>
              )}
            </div>

            <p>
              By enrolling, you’ll gain access to course materials, session updates,
              and any assessments or assignments tied to this program.
            </p>

            <p><strong>Training Fee: </strong>KES {enrollingClass?.training_fee || 'N/A'}</p>

            <p className="text-yellow-600 font-medium">
              Note: Once enrolled, you may need to contact your instructor or admin to withdraw.
            </p>
          </div>
        }
        onConfirm={handleEnrollStudent}
        isLoading={enrollStudent.isPending}
        confirmText="Yes, Enroll Me"
        cancelText="No, Cancel"
        variant="primary"
      />

      <ConfirmModal
        open={openCartModal}
        setOpen={setOpenCartModal}
        title="Your Cart"
        description={
          <div className="space-y-4 text-sm text-foreground">
            {cart?.items?.length === 0 && (
              <p className="text-muted-foreground text-center">Your cart is empty.</p>
            )}

            {cart?.items?.map((item: any) => (
              <div
                key={item.id}
                className="rounded-md border bg-muted/50 p-3 space-y-1"
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground text-xs">
                  Quantity: {item.quantity}
                </p>
                <p className="text-xs">Unit Price: ${item.unit_price}</p>
                <p className="text-xs font-semibold">
                  Subtotal: ${item.total}
                </p>
              </div>
            ))}

            <div className="border-t pt-3">
              <p className="font-semibold text-base">
                Cart Total: ${cart?.total}
              </p>
            </div>
          </div>
        }
        confirmText="Proceed to Payment"
        cancelText="Close"
        variant="primary"
        onConfirm={() => {
          handlePaymentSession(cart)
        }}
      />

    </div>
  );
};

export default EnrollmentPage;
