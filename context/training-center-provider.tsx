"use client"

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { fetchTrainingCenters } from "@/app/auth/create-account/actions"
import { toast } from "sonner"
import { TrainingCenter } from "@/app/auth/create-account/_components/form"
import { useSessionContext } from "@/context/session-provider-wrapper"

export interface UseTrainingCenterReturn {
  trainingCenter: TrainingCenter | null;
  loading: boolean;
  error: Error | null;
  refetchTrainingCenter: () => Promise<void>;
}

const initialState: Omit<UseTrainingCenterReturn, "refetchTrainingCenter"> = {
  trainingCenter: null,
  loading: true,
  error: null
}

export function useTrainingCenter(): UseTrainingCenterReturn {
  const [state, setState] = useState(initialState)
  const { session } = useSessionContext()

  const trainingCenterSlug = useMemo(() => session?.decoded?.organization?.[0] ?? null, [session?.decoded?.organization])

  const fetchTrainingCenter = useCallback(async () => {
    if (!trainingCenterSlug) {
      setState((prev) => ({ ...prev, loading: false, error: new Error("No training center slug found") }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const param = new URLSearchParams({ slug_eq: trainingCenterSlug })
      const response = await fetchTrainingCenters(0, param.toString())

      if (!response.success || response.data.content.length === 0) {
        throw new Error("No training center found")
      }

      const [trainingCenter] = response.data.content
      setState({ trainingCenter, loading: false, error: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong while fetching training center."
      setState({ trainingCenter: null, loading: false, error: new Error(errorMessage) })
      toast.error(errorMessage)
    }
  }, [trainingCenterSlug])

  useEffect(() => {
    fetchTrainingCenter()
  }, [fetchTrainingCenter])

  return { ...state, refetchTrainingCenter: fetchTrainingCenter }
}

const TrainingCenterContext = createContext<UseTrainingCenterReturn | null>(null)

export function TrainingCenterProvider({ children }: { children: ReactNode }) {
  const trainingCenterData = useTrainingCenter()

  return (
    <TrainingCenterContext.Provider value={trainingCenterData}>
      {children}
    </TrainingCenterContext.Provider>
  )
}

export function useTrainingCenterContext() {
  const context = useContext(TrainingCenterContext)

  if (!context) {
    throw new Error(
      "useTrainingCenterContext must be used within a TrainingCenterProvider"
    )
  }

  return context
}

