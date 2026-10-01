import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AllSchemaTypes } from '@/lib/types';

type DataFetcher = (
  key: string,
  dataFetcher: () => Promise<AllSchemaTypes | AllSchemaTypes[] | null>
) => void;

type AppStoreType = {
  data: { [key: string]: AllSchemaTypes | AllSchemaTypes[] };
  softUpdate: (key: string, newDate: AllSchemaTypes) => void;
  setData: DataFetcher;
};

export const appStore = create<AppStoreType>()(
  persist(
    set => ({
      data: {},
      softUpdate(key: string, newData: AllSchemaTypes) {
        set({ data: { ...this.data, [key]: newData } });
      },
      async setData(
        dataKey: string,
        dataFetcher: () => Promise<AllSchemaTypes | AllSchemaTypes[] | null>
      ) {
        const dataFromAPI = await dataFetcher();
        if (dataFromAPI)
          set({
            data: {
              ...this.data,
              [dataKey]: dataFromAPI as AllSchemaTypes | AllSchemaTypes[],
            },
          });
      },
    }),
    {
      name: 'app-store',
      partialize: state => ({ data: state.data }),
    }
  )
);
