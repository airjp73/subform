import { createContext, useCallback, useContext, useRef } from "react";
import type { FormStoreState, GenericObj } from "./store";
import { makeFormStore } from "./store";
import { useStore, type StoreApi } from "zustand";

export type FormContextType = {
  store: StoreApi<FormStoreState<GenericObj>>;
};

export const FormContext = createContext<FormContextType | null>(null);
export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error("FormContext not found");
  return context;
};

const createForm = <Data extends GenericObj>(opts: UseFormOptions<Data>) => {
  const store = makeFormStore(opts.initialValues);

  const contextValue: FormContextType = {
    store: store as any,
  };

  const FormstandProvider = ({ children }: { children: React.ReactNode }) => {
    return (
      <FormContext.Provider value={contextValue}>
        {children}
      </FormContext.Provider>
    );
  };

  return {
    getValues: () => store.getState().values,
    Provider: FormstandProvider,
  };
};

type UseFormOptions<Data extends GenericObj> = {
  initialValues: Data;
};
export const useForm = <Data extends GenericObj>(
  opts: UseFormOptions<Data>
) => {
  const storeRef = useRef<ReturnType<typeof createForm<Data>> | null>(null);
  if (!storeRef.current) storeRef.current = createForm(opts);
  return storeRef.current;
};

export const useField = (name: string) => {
  const { store } = useFormContext();
  const meta = useStore(store, (state) => state.getMeta(name));
  const value = useStore(store, (state) => state.getValue(name));
  const setValue = useStore(store, (state) => state.setValue);

  const setFieldValue = useCallback(
    (value: any) => {
      setValue(name, value);
    },
    [name, setValue]
  );

  return {
    meta,
    value,
    setValue: setFieldValue,
  };
};
