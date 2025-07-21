import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AllSchemaTypes } from "@/lib/types";
import { useEffect, useState } from "react";

type DataFetcher = (key: string, dataFetcher: () => Promise<AllSchemaTypes | AllSchemaTypes[] | null>) => void

type AppStoreType = {
    data: { [key: string]: AllSchemaTypes | AllSchemaTypes[] },
    softUpdate: (key: string, newDate: AllSchemaTypes) => void,
    setData: DataFetcher
}

export const appStore = create<AppStoreType>()(
    persist((set) => ({
        data: {},
        softUpdate(key: string, newData: AllSchemaTypes) {
            set({ data: { ...this.data, [key]: newData } })
        },
        async setData(dataKey: string, dataFetcher: () => Promise<AllSchemaTypes | AllSchemaTypes[] | null>) {
            const dataFromAPI = await dataFetcher();
            if (dataFromAPI) set({
                data: {
                    ...this.data,
                    [dataKey]: dataFromAPI as AllSchemaTypes | AllSchemaTypes[]
                }
            });
        }
    }), {
        name: "app-store",
        partialize: state => ({ data: state.data })
    })
);

export function useAppStore(key: string, fetcher: () => Promise<AllSchemaTypes | AllSchemaTypes[] | null>) {
    const store = appStore();
    const [resource, setResource] = useState<AllSchemaTypes | AllSchemaTypes[] | null | undefined>(store.data[key]);
    useEffect(() => {
        if (!resource) {
            if (store.data[key]) {
                setResource(store.data[key])
            }
            else {
                store.setData(key, async () => {
                    const resourceData = await fetcher();
                    setResource(resourceData);
                    return resourceData;
                });
            }
        }
    }, []);

    return resource;
}