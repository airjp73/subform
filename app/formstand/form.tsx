import type { FormEvent } from "react";
import * as R from "remeda";
import { createContext, useCallback, useContext, useRef } from "react";
import type {
  DataAtPath,
  FieldMeta,
  FormStoreState,
  FormstandOptions,
  GenericObj,
  Paths,
  ValidationBehaviorConfig,
} from "./store";
import { makeFormStore } from "./store";
import { useStore, type StoreApi } from "zustand";

export type FormContextType = {
  store: StoreApi<FormStoreState<any, unknown>>;
};

export const FormContext = createContext<FormContextType | null>(null);
export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error("FormContext not found");
  return context;
};

export type UseFieldOptions = {
  validationBehavior?: ValidationBehaviorConfig;
};

export type UseFieldResult<Data> = {
  meta: FieldMeta;
  value: Data;
  setValue: (value: Data) => void;
  getInputProps: () => {
    name: string;
    onChange: (e: any) => void;
    onBlur: () => void;
    value: Data;
  };
};

export interface Field<Data> {
  <N extends Paths<Data>>(name: N): Field<DataAtPath<Data, N>>;
  path: Paths<Data>;
  store: StoreApi<FormStoreState<any, unknown>>;

  useField: (opts?: UseFieldOptions) => UseFieldResult<Data>;

  getValue: () => Data;
  setValue: (value: Data) => void;
  useValue: () => Data;

  getMeta: () => any;
  useMeta: () => any;

  setTouched: (value: boolean) => void;
  useTouched: () => boolean;

  setError: (value: any) => void;
  useError: () => any;

  setDirty: (value: boolean) => void;
  useDirty: () => boolean;
}

function makeField<Data>(
  // This is really just a trick to get the type system to work
  _data: Data,
  prefix: string,
  store: StoreApi<FormStoreState<any, any>>
): Field<Data> {
  const field: Field<Data> = (name) =>
    makeField(
      null as any,
      prefix === "" ? name : (`${prefix}.${name}` as any),
      store
    );

  field.path = prefix as any;
  field.store = store;

  field.getValue = () => store.getState().getValue(prefix);
  field.setValue = (value) => store.getState().setValue(prefix, value as any);
  const useValue = () => useStore(store, (state) => state.getValue(prefix));
  field.useValue = useValue;

  field.getMeta = () => store.getState().getMeta(prefix);
  const useMeta = () => useStore(store, (state) => state.getMeta(prefix));
  field.useMeta = useMeta;

  field.setTouched = (value) => store.getState().setTouched(prefix, value);
  const useTouched = () =>
    useStore(store, (state) => state.getMeta(prefix).touched);
  field.useTouched = useTouched;

  field.setError = (value) => store.getState().setError(prefix, value);
  const useError = () =>
    useStore(store, (state) => state.getMeta(prefix).error);
  field.useError = useError;

  field.setDirty = (value) => store.getState().setDirty(prefix, value);
  const useDirty = () =>
    useStore(store, (state) => state.getMeta(prefix).dirty);
  field.useDirty = useDirty;

  function useField(opts: UseFieldOptions = {}): UseFieldResult<Data> {
    const meta = field.useMeta();
    const value = field.useValue();
    const setValue = field.setValue;
    const onChange = useStore(field.store, (state) => state.onChange);
    const onBlur = useStore(field.store, (state) => state.onBlur);
    const hasSubmitBeenAttempted = useStore(
      field.store,
      (state) => state.hasSubmitBeenAttempted
    );

    const formLevelValidationBehavior = useStore(
      field.store,
      (state) => state.validationBehavior
    );
    const validationBehavior =
      opts.validationBehavior ?? formLevelValidationBehavior;
    const currentBehavior = hasSubmitBeenAttempted
      ? validationBehavior.whenSubmitted
      : meta.touched
      ? validationBehavior.whenTouched
      : validationBehavior.initial;
    const validateOnChange = currentBehavior === "onChange";
    const validateOnBlur =
      currentBehavior === "onBlur" || currentBehavior === "onChange";

    const getInputProps = useCallback(() => {
      return {
        name: field.path,
        onChange: (e: any) => {
          onChange(field.path, e.target.value, validateOnChange);
        },
        onBlur: () => {
          onBlur(field.path, validateOnBlur);
        },
        value,
      };
    }, [onBlur, onChange, validateOnBlur, validateOnChange, value]);

    return {
      meta,
      value,
      setValue,
      getInputProps,
    };
  }
  field.useField = useField;

  return field;
}

const createForm = <Data extends GenericObj, Output>(
  opts: FormstandOptions<Data, Output>
) => {
  const store = makeFormStore(opts);
  const field = makeField(opts.initialValues, "", store);

  const useIsSubmitting = () => {
    const isSubmitting = useStore(store, (state) => state.isSubmitting);
    return isSubmitting;
  };

  const contextValue: FormContextType = { store };
  const Provider = ({ children }: { children: React.ReactNode }) => {
    return (
      <FormContext.Provider value={contextValue}>
        {children}
      </FormContext.Provider>
    );
  };

  return {
    field,
    ...R.omit(field, ["path"]),
    handleSubmit:
      (cb: (values: Output) => void | Promise<void>) =>
      (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        store.getState().submit(cb);
      },
    useIsSubmitting,
    Provider,
  };
};

export type Formstand<
  Data extends GenericObj = any,
  Output = unknown
> = ReturnType<typeof createForm<Data, Output>>;

export const useForm = <Data extends GenericObj, Output>(
  opts: FormstandOptions<Data, Output>
): Formstand<Data, Output> => {
  const storeRef = useRef<Formstand<Data, Output> | null>(null);
  if (!storeRef.current) storeRef.current = createForm(opts);
  return storeRef.current;
};
