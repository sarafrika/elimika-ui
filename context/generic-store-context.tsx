import { set } from "date-fns";
import { createContext, ReactNode, useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type StoreDataType = { [key: string]: string | number | boolean | object | undefined }

export type GenericStoreType = {
    data?: StoreDataType | null,
    fetchData: () => Promise<StoreDataType | undefined>
    get?: () => Promise<void>
}

type StoreProviderProps = {
    store: GenericStoreType,
    children: ReactNode,
    storeName: string
}

export function useStore(storeName: string, store: GenericStoreType) {
    return create<GenericStoreType>()(
        persist((set, get) => {
            
            return {
                data: null,
                ...store,
                get: async () => {
                    set({ data: await store.fetchData() })
                }
            }
        }, {
            name: storeName
        })
    )()
}

export const StoreContext = createContext<{ [key: string]: GenericStoreType } | null>(null);

export default function StoreContextProvider({
    storeName,
    children,
    store
}: StoreProviderProps) {
    const Store = useStore(storeName, store);
    const storeVariableName = storeName.split("-").map(w => `${w[0]?.toUpperCase()}${w.substring(1)}`).join("")
    const [stores, setStores] = useState<{ [key: string]: GenericStoreType } | null>({ [storeVariableName]: Store });

    useEffect(() => {
        if (stores && stores[storeVariableName] && !stores[storeVariableName].data) {
            stores[storeVariableName].fetchData().then(() => setStores({ ...stores }));
        }
    }, [stores])

    return (<StoreContext.Provider value={stores}>
        {children}
    </StoreContext.Provider>);
}

/* export function useStoreProvider(storeName: string, store: GenericStoreType) {

    const StoreContext = createContext<GenericStoreType | null>(null);

    function StoreContextProvider({ children }: { children: ReactNode }) {
        const { data } = store;
        const Store = useStore(storeName, store);

        useEffect(() => {
            if (!Store.data) {
                if (Store.get) Store.get();
            }
        }, []);

        return (<StoreContext.Provider value={Store}>
            {children}
        </StoreContext.Provider>);
    }

    return { StoreContext, StoreContextProvider }

} */

