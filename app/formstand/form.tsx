import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useRef } from "react";
import {
  makeFormStore,
  type DataAtPath,
  type FieldMeta,
  type FormStoreState,
  type FormstandOptions,
  type GenericObj,
  type Paths,
  type ValidationBehaviorConfig,
} from "./store";
import { useStore, type StoreApi } from "zustand";

export type FormContextType = {
  store: StoreApi<FormStoreState<any, unknown>>;
};

export type UseFieldOptions = {
  validationBehavior?: ValidationBehaviorConfig;
};

export type GetInputPropsOpts<Data> = {
  format?: (value: Data) => string;
  parse?: (value: string) => Data;
};
export type GetInputPropsResult = {
  name: string;
  onChange: (e: ChangeEvent<any>) => void;
  onBlur: () => void;
  value: string;
};

export type GetInputProps<Data> = Data extends string
  ? (opts?: GetInputPropsOpts<Data>) => GetInputPropsResult
  : (opts: Required<GetInputPropsOpts<Data>>) => GetInputPropsResult;

export type UseFieldResult<Data> = {
  meta: FieldMeta;
  value: Data;
  setValue: (value: Data) => void;
  getInputProps: GetInputProps<Data>;
  onChange: (value: Data) => void;
  onBlur: () => void;
};

export interface Formstand<
  Data,
  RootData extends GenericObj = GenericObj,
  Output = unknown
> {
  <N extends Paths<Data>>(name: N): Formstand<
    DataAtPath<Data, N>,
    RootData,
    Output
  >;
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

  handleSubmit: (
    cb: (values: Output) => void | Promise<void>
  ) => (e: FormEvent<HTMLFormElement>) => void;
  useIsSubmitting: () => boolean;
}

function createForm<Data, RootData extends GenericObj, Output>(
  _data: Data,
  prefix: Paths<RootData>,
  store: StoreApi<FormStoreState<RootData, Output>>
) {
  const form: Formstand<Data> = (name) =>
    createForm(
      null as any,
      prefix === "" ? name : (`${prefix}.${name}` as any),
      store
    );

  form.path = prefix as any;
  form.store = store;

  form.getValue = () => store.getState().getValue(prefix);
  form.setValue = (value) => store.getState().setValue(prefix, value as any);
  const useValue = () => useStore(store, (state) => state.getValue(prefix));
  form.useValue = useValue;

  form.getMeta = () => store.getState().getMeta(prefix);
  const useMeta = () => useStore(store, (state) => state.getMeta(prefix));
  form.useMeta = useMeta;

  form.setTouched = (value) => store.getState().setTouched(prefix, value);
  const useTouched = () =>
    useStore(store, (state) => state.getMeta(prefix).touched);
  form.useTouched = useTouched;

  form.setError = (value) => store.getState().setError(prefix, value);
  const useError = () =>
    useStore(store, (state) => state.getMeta(prefix).error);
  form.useError = useError;

  form.setDirty = (value) => store.getState().setDirty(prefix, value);
  const useDirty = () =>
    useStore(store, (state) => state.getMeta(prefix).dirty);
  form.useDirty = useDirty;

  const useIsSubmitting = () => {
    const isSubmitting = useStore(store, (state) => state.isSubmitting);
    return isSubmitting;
  };
  form.useIsSubmitting = useIsSubmitting;

  form.handleSubmit = (cb) => (e) => {
    e.preventDefault();
    store.getState().submit(cb);
  };

  function useField(opts: UseFieldOptions = {}): UseFieldResult<Data> {
    const meta = form.useMeta();
    const value = form.useValue();
    const setValue = form.setValue;
    const onChange = useStore(form.store, (state) => state.onChange);
    const onBlur = useStore(form.store, (state) => state.onBlur);
    const hasSubmitBeenAttempted = useStore(
      form.store,
      (state) => state.hasSubmitBeenAttempted
    );

    const formLevelValidationBehavior = useStore(
      form.store,
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

    const directOnChange = useCallback(
      (value: Data) => {
        onChange(form.path, value as any, validateOnChange);
      },
      [onChange, validateOnChange]
    );

    const directOnBlur = useCallback(() => {
      onBlur(form.path, validateOnBlur);
    }, [onBlur, validateOnBlur]);

    const getInputProps = useCallback(
      (opts?: GetInputPropsOpts<Data>): GetInputPropsResult => {
        return {
          name: form.path,
          onChange: (e: ChangeEvent<any>) => {
            const value = opts?.parse
              ? opts.parse(e.target.value)
              : e.target.value;
            directOnChange(value);
          },
          onBlur: () => {
            directOnBlur();
          },
          value: (opts?.format ? opts.format(value) : value) as string,
        };
      },
      [directOnBlur, directOnChange, value]
    );
    return {
      meta,
      value,
      setValue,
      getInputProps: getInputProps as GetInputProps<Data>,
      onChange: directOnChange,
      onBlur: directOnBlur,
    };
  }
  form.useField = useField;

  return form;
}

export const useForm = <Data extends GenericObj, Output>(
  opts: FormstandOptions<Data, Output>
): Formstand<Data, Data, Output> => {
  const storeRef = useRef<Formstand<Data, Data, Output> | null>(null);
  if (!storeRef.current)
    storeRef.current = createForm(
      null as any,
      "" as any,
      makeFormStore(opts)
    ) as any;
  return storeRef.current as any;
};
