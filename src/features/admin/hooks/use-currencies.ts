'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { extractList } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import type { Currency } from '@/services/client';
import { activate, createCurrency, deactivate, makeDefault, updateCurrency } from '@/services/client';
import { listAllOptions } from '@/services/client/@tanstack/react-query.gen';
import { configQuery } from '../lib/admin-queries';

export interface CurrencyFormValues {
  code: string;
  name: string;
  symbol?: string;
  numeric_code?: number;
  decimal_places: number;
  default_currency: boolean;
}

/** Every currency the platform knows, active or not, sorted by code. */
export function useCurrencies() {
  const query = useQuery({ ...listAllOptions(), ...configQuery });

  const currencies = useMemo(() => {
    const items = extractList<Currency>(query.data);
    return [...items].sort((a, b) => (a.code ?? '').localeCompare(b.code ?? ''));
  }, [query.data]);

  return { currencies, query };
}

function useCurrencyRefresh() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: listAllOptions().queryKey });
}

/** Add a currency. The API ignores `active`, so a new one is inactive unless it is the default. */
export function useCreateCurrency() {
  const refresh = useCurrencyRefresh();

  return useMutation({
    mutationFn: async (values: CurrencyFormValues) => {
      const { data } = await createCurrency({
        body: {
          code: values.code.trim().toUpperCase(),
          name: values.name.trim(),
          symbol: values.symbol?.trim() || undefined,
          numeric_code: values.numeric_code,
          decimal_places: values.decimal_places,
          default_currency: values.default_currency,
        },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, values) => {
      await refresh();
      toast.success(`${values.code.toUpperCase()} added`);
    },
    onError: (error, values) =>
      toast.error(getErrorMessage(error, `Could not add ${values.code.toUpperCase()}`)),
  });
}

/**
 * Edit a currency's details. `active` is deliberately never sent: that path skips the
 * guard that stops the default currency being switched off. Activation goes through
 * the dedicated endpoints instead.
 */
export function useUpdateCurrency() {
  const refresh = useCurrencyRefresh();

  return useMutation({
    mutationFn: async ({ code, values }: { code: string; values: CurrencyFormValues }) => {
      const { data } = await updateCurrency({
        path: { code },
        body: {
          name: values.name.trim(),
          symbol: values.symbol?.trim() || undefined,
          numeric_code: values.numeric_code,
          decimal_places: values.decimal_places,
        },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await refresh();
      toast.success(`${variables.code} updated`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not update ${variables.code}`)),
  });
}

/** Turn a currency on or off. Deactivating the platform default comes back as a conflict. */
export function useSetCurrencyActive() {
  const refresh = useCurrencyRefresh();

  return useMutation({
    mutationFn: async ({ code, active }: { code: string; active: boolean }) => {
      const call = active ? activate : deactivate;
      const { data } = await call({ path: { code }, throwOnError: true });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await refresh();
      toast.success(`${variables.code} is ${variables.active ? 'active' : 'inactive'}`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not change ${variables.code}`)),
  });
}

/** Make a currency the platform default; it is activated in the same move. */
export function useMakeDefaultCurrency() {
  const refresh = useCurrencyRefresh();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await makeDefault({ path: { code }, throwOnError: true });
      return data;
    },
    onSuccess: async (_data, code) => {
      await refresh();
      toast.success(`${code} is the default currency`);
    },
    onError: (error, code) => toast.error(getErrorMessage(error, `Could not make ${code} default`)),
  });
}
