import { UseMutationResult } from "@tanstack/react-query";
import { useEffect, useState } from "react"


type MutationTuple = readonly UseMutationResult<any, any, any>[]

export default function useMultiMutations<T extends MutationTuple>(mutations: T) {

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<any[]>();

    useEffect(() => {
        setSubmitting(mutations.some(m => m.isPending));
        const hasErrors = mutations.some(m => m.error !== null);
        if (mutations.length > 0 && hasErrors) {
            setErrors([mutations.reduce<any[]>((a, b) => (b.error ? [...a, b.error] : a), [])])
        }
        console.log(mutations.map(a => console.log(a)))
    }, mutations.reduce((a: any, b) => ([...a, b.isPending, b.status]), []));

    return { submitting, errors, resetErrors: setErrors }
}