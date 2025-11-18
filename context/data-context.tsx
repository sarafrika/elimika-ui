import type { AllSchemaTypes, SchemaType } from '@/lib/types';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DataType = { [key: string]: AllSchemaTypes | AllSchemaTypes[] | number } & {
  expires?: number;
};

type DataStoreType = {
  data: DataType;
  get: (key: string) => AllSchemaTypes | AllSchemaTypes[];
  has: (key: string) => boolean;
  softUpdate: (key: string, newDate: AllSchemaTypes | AllSchemaTypes[] | null) => void;
};

const dataStore = create<DataStoreType>()(
  persist(
    set => ({
      data: {},
      get(key: string) {
        return this.data[key] as AllSchemaTypes | AllSchemaTypes[];
      },
      has(key: string) {
        return key in this.data;
      },
      softUpdate(key: string, newData: AllSchemaTypes | AllSchemaTypes[] | null) {
        set({ data: { ...this.data, [key]: newData } as DataType });
      },
    }),
    {
      name: 'data-store',
      partialize: state => state.data,
    }
  )
);

type ConfigType = (
  schema: SchemaType,
  dataFethcer: () => Promise<AllSchemaTypes | AllSchemaTypes[] | null>,
  offline: boolean
) => void;
const UserDataStoreContext = createContext<{
  data?: DataType;
  configure?: ConfigType;
}>({});
export default function UserDataProvider({ children }: { children: ReactNode }) {
  const store = dataStore();
  const [data, setData] = useState<DataType | undefined>(store.data);

  function configure<_T>(
    schema: SchemaType,
    dataFethcer: () => Promise<AllSchemaTypes | AllSchemaTypes[] | null>,
    offline: boolean
  ) {
    const now = Date.now();
    /* if (offline && data && data.expires && data.expires > now) {
            return data[key]
        }*/

    // if(data && schema in data && data.expires && data.expires > now){
    //     // setData(data.Student)
    // }
    if (!data || !(schema in data)) {
      dataFethcer().then(newData => {
        if (offline) {
          store.softUpdate(schema as string, newData);
        }
        setData({ ...data, expires: now + 36000, [schema]: newData } as DataType);
      });
    }
  }

  return (
    <UserDataStoreContext.Provider value={{ data, configure }}>
        {children}
      </UserDataStoreContext.Provider>
  );
}

export function useUserData(
  ...params: [SchemaType, () => Promise<AllSchemaTypes | AllSchemaTypes[] | null>, boolean]
) {
  const { data, configure } = useContext(UserDataStoreContext);
  useEffect(() => {
    if (configure) configure(...params);
  }, [configure, params]);
  return data;
}

/* type StoreDataType = { [key: string]: string | number | boolean | object | undefined }

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
} */

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
