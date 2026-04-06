import type { UseMutationResult } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { AllSchemaTypes } from '@/lib/types';
import type { ResponseDtoVoid } from '@/services/api/schema';

type MutationTuple = readonly UseMutationResult<unknown, unknown, unknown, unknown>[];

export default function useMultiMutations<T extends MutationTuple>(mutations: T) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Array<T[number]['error']>>();
  const [datas, setDatas] = useState<AllSchemaTypes[]>();
  const [responses, _setResponses] = useState<ResponseDtoVoid[]>();

  useEffect(
    () => {
      setSubmitting(mutations.some(m => m.isPending));
      const allErrors = mutations.reduce<Array<T[number]['error']>>(
        (a, m) => (m.isError ? [...a, m.error] : a),
        []
      );
      setErrors(allErrors);

      const allDatas = mutations.reduce<AllSchemaTypes[]>(
        (a, m) => (!m.isError && m.isSuccess ? [...a, m.data as AllSchemaTypes] : a),
        []
      );
      setDatas(allDatas);
    },
    mutations.flatMap(mutation => [mutation.isPending, mutation.status, mutation.isError])
  );

  return { submitting, errors, datas, responses, resetErrors: setErrors };
}
