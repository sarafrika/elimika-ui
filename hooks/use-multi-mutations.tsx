import { AllSchemaTypes } from "@/lib/types";
import { UseMutationResult } from "@tanstack/react-query";
import { useEffect, useState } from "react"


type MutationTuple = readonly UseMutationResult<AllSchemaTypes, any, any>[]

export default function useMultiMutations<T extends MutationTuple>(mutations: T) {

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<any[]>();
    const [datas, setDatas] = useState<AllSchemaTypes[]>();

    mutations.reduce((a: any, b) => console.log(b.error), [])

    useEffect(() => {
        setSubmitting(mutations.some(m => m.isPending));
        const allErrors = mutations.reduce<any[]>((a, m) => (m.isError ? [...a, m.error] : a), []);
        setErrors(allErrors);

        const allDatas = mutations.reduce<any[]>((a, m) => (!m.isError && m.isSuccess ? [...a, m.data] : a), []);
        setDatas(allDatas)
    }, mutations.reduce((a: any, b) => ([...a, b.isPending, b.status, b.isError]), []));

    return { submitting, errors, datas, resetErrors: setErrors }
}