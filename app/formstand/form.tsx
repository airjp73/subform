import type { ChangeEvent } from "react";
import { useCallback, useRef } from "react";
import {
  type FieldMeta,
  type FormstandOptions,
  type GenericObj,
  type ValidationBehaviorConfig,
} from "./store";
import { createFormstand, type Formstand } from "./formstand";
import {
  useHasSubmitBeenAttempted,
  useMeta,
  useValidationBehavior,
  useValue,
} from "./react";
import { handleBlur, handleChange, setValue } from "./operations";

export type UseFieldOptions<Data> = {
  formstand: Formstand<Data>;
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

export function useField<Data>(
  opts: UseFieldOptions<Data>
): UseFieldResult<Data> {
  const meta = useMeta(opts.formstand);
  const value = useValue(opts.formstand);
  const hasSubmitBeenAttempted = useHasSubmitBeenAttempted(opts.formstand);
  const formLevelValidationBehavior = useValidationBehavior(opts.formstand);

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
      handleChange(opts.formstand, value as any, validateOnChange);
    },
    [opts.formstand, validateOnChange]
  );

  const directOnBlur = useCallback(() => {
    handleBlur(opts.formstand, validateOnBlur);
  }, [opts.formstand, validateOnBlur]);

  const directSetValue = useCallback(
    (value: Data) => {
      setValue(opts.formstand, value);
    },
    [opts.formstand]
  );

  const getInputProps = useCallback(
    ({ format, parse }: GetInputPropsOpts<Data> = {}): GetInputPropsResult => {
      return {
        name: opts.formstand.path,
        onChange: (e: ChangeEvent<any>) => {
          const value = parse ? parse(e.target.value) : e.target.value;
          directOnChange(value);
        },
        onBlur: () => {
          directOnBlur();
        },
        value: (format ? format(value) : value) as string,
      };
    },
    [directOnBlur, directOnChange, opts.formstand.path, value]
  );

  return {
    meta,
    value,
    setValue: directSetValue,
    getInputProps: getInputProps as GetInputProps<Data>,
    onChange: directOnChange,
    onBlur: directOnBlur,
  };
}

export const useForm = <Data extends GenericObj, Output>(
  opts: FormstandOptions<Data, Output>
): Formstand<Data, Data, Output> => {
  const storeRef = useRef<Formstand<Data, Data, Output> | null>(null);
  if (!storeRef.current) storeRef.current = createFormstand(opts);
  return storeRef.current as any;
};
