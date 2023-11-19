import type { FormEvent } from "react";
import { createContext, useCallback, useContext, useRef } from "react";
import type { FormStoreState, FormstandOptions, GenericObj } from "./store";
import { makeFormStore } from "./store";
import { useStore, type StoreApi } from "zustand";

export type FormContextType = {
  store: StoreApi<FormStoreState<GenericObj, unknown>>;
};

export const FormContext = createContext<FormContextType | null>(null);
export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error("FormContext not found");
  return context;
};

const createForm = <Data extends GenericObj, Output>(
  opts: FormstandOptions<Data, Output>
) => {
  const store = makeFormStore(opts);

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
    handleSubmit:
      (cb: (values: Output) => void | Promise<void>) =>
      (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        store.getState().submit(cb);
      },
    getValues: () => store.getState().values,
    Provider: FormstandProvider,
  };
};

export const useForm = <Data extends GenericObj, Output>(
  opts: FormstandOptions<Data, Output>
) => {
  const storeRef = useRef<ReturnType<typeof createForm<Data, Output>> | null>(
    null
  );
  if (!storeRef.current) storeRef.current = createForm(opts);
  return storeRef.current;
};

export type UseFieldOptions = {
  name: string;
};
export const useField = ({ name }: UseFieldOptions) => {
  const { store } = useFormContext();
  const meta = useStore(store, (state) => state.getMeta(name));
  const value = useStore(store, (state) => state.getValue(name));
  const setValue = useStore(store, (state) => state.setValue);
  const onChange = useStore(store, (state) => state.onChange);

  const setFieldValue = useCallback(
    (value: any) => {
      setValue(name, value);
    },
    [name, setValue]
  );

  const getInputProps = useCallback(() => {
    return {
      name,
      onChange: (e: any) => {
        onChange(name, e.target.value);
      },
      onBlur: () => {},
      value,
    };
  }, [name, onChange, value]);

  return {
    meta,
    value,
    setValue: setFieldValue,
    getInputProps,
  };
};

export const useIsSubmitting = () => {
  const { store } = useFormContext();
  return useStore(store, (state) => state.isSubmitting);
};
