'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { CreateClassModal } from './create-class-modal';
import { PostJobModal } from './post-job-modal';
import { CREATE_CLASS_MODAL, MODAL_PARAM, MODAL_PARAMS, POST_JOB_MODAL } from './routes';

/** Opens Create class or Post job over whichever organisation page names it in `?modal=`. */
export function ClassJobModals() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const modal = searchParams.get(MODAL_PARAM);
  if (modal !== CREATE_CLASS_MODAL && modal !== POST_JOB_MODAL) return null;

  const read = (key: string) => searchParams.get(key)?.trim() || undefined;
  const close = () => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of MODAL_PARAMS) next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  // A new key remounts the modal, so switching prefill starts from a clean form.
  const key = searchParams.toString();

  return modal === CREATE_CLASS_MODAL ? (
    <CreateClassModal
      key={key}
      onClose={close}
      prefill={{
        job: read('job'),
        instructorUuid: read('instructorUuid'),
        courseUuid: read('courseUuid'),
        programUuid: read('programUuid'),
        date: read('date'),
        startTime: read('startTime'),
        endTime: read('endTime'),
      }}
    />
  ) : (
    <PostJobModal
      key={key}
      onClose={close}
      prefill={{
        jobUuid: read('jobUuid'),
        repostFrom: read('repostFrom'),
        courseUuid: read('courseUuid'),
        programUuid: read('programUuid'),
      }}
    />
  );
}
