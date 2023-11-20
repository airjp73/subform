import type { ChangeEvent } from "react";
import * as R from "remeda";
import { useCallback, useReducer, useRef } from "react";
import type {
  FieldArrayValidationBehaviorConfig,
  FieldMeta,
  FormstandOptions,
  GenericObj,
  ValidationBehaviorConfig,
} from "./store";
import { createFormstand, type Formstand } from "./formstand";
import {
  useError,
  useHasSubmitBeenAttempted,
  useMeta,
  useValue,
} from "./react";
import {
  array,
  handleBlur,
  handleChange,
  setValue,
  validate,
} from "./operations";
import * as A from "./array";
import { useStore } from "zustand";
import { getStore } from "./internal";
import { simpleId } from "./simpleId";

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
  const formLevelValidationBehavior = useStore(
    getStore(opts.formstand),
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

export type UseFieldArrayOpts<Item> = {
  formstand: Formstand<Item[]>;
  validationBehavior?: FieldArrayValidationBehaviorConfig;
};

export type UseFieldArrayResult<Item> = {
  map: <Output>(
    fn: (formstand: Formstand<Item>, key: string, index: number) => Output
  ) => Output[];
  error: string | undefined;
  pop: () => void;
  push: (item: Item) => void;
  remove: (index: number) => void;
  swap: (indexA: number, indexB: number) => void;
  move: (from: number, to: number) => void;
  insert: (index: number, item: Item) => void;
  unshift: (item: Item) => void;
  shift: () => void;
  replace: (index: number, items: Item) => void;
};

export const useFieldArray = <Item,>(
  opts: UseFieldArrayOpts<Item>
): UseFieldArrayResult<Item> => {
  const formLevelValidationBehavior = useStore(
    getStore(opts.formstand),
    (state) => state.fieldArrayValidationBehavior
  );
  const hasSubmitBeenAttempted = useHasSubmitBeenAttempted(opts.formstand);

  const validationBehavior =
    opts.validationBehavior ?? formLevelValidationBehavior;
  const currentBehavior = hasSubmitBeenAttempted
    ? validationBehavior.whenSubmitted
    : validationBehavior.initial;
  const validateOnChange = currentBehavior === "onChange";
  const maybeValidate = useCallback(() => {
    if (validateOnChange) validate(opts.formstand);
  }, [opts.formstand, validateOnChange]);

  const arrayLength = useStore(
    getStore(opts.formstand),
    (state) => (state.getValue(opts.formstand.path) as any[]).length
  );

  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const keys = useRef<string[]>([]);

  // If the lengths don't match up it means one of two things
  // 1. The array has been modified outside of this hook
  // 2. We're initializing the array
  if (keys.current.length !== arrayLength)
    keys.current = R.range(0, arrayLength).map(simpleId);

  const formstandInstance = opts.formstand;

  return {
    error: useError(opts.formstand),
    map: useCallback(
      <Output,>(
        fn: (formstand: Formstand<Item>, key: string, index: number) => Output
      ) => {
        return keys.current.map((key, index) => {
          const formstand = formstandInstance(`${index}` as any);
          return fn(formstand, key, index);
        });
      },
      // For some reason, the linter won't let us put `opts.formstand` here
      [formstandInstance]
    ),
    pop: useCallback(() => {
      array.pop(opts.formstand);
      keys.current = A.pop(keys.current);
      maybeValidate();
      // Will update automatically because the length changed
    }, [maybeValidate, opts.formstand]),

    push: useCallback(
      (item: Item) => {
        array.push(opts.formstand, item as any);
        keys.current = A.push(keys.current, simpleId());
        maybeValidate();
        // Will update automatically because the length changed
      },
      [maybeValidate, opts.formstand]
    ),

    remove: useCallback(
      (index: number) => {
        array.remove(opts.formstand, index);
        keys.current = A.remove(keys.current, index);
        maybeValidate();
        // Will update automatically because the length changed
      },
      [maybeValidate, opts.formstand]
    ),

    swap: useCallback(
      (indexA: number, indexB: number) => {
        array.swap(opts.formstand, indexA, indexB);
        keys.current = A.swap(keys.current, indexA, indexB);
        maybeValidate();
        forceUpdate();
      },
      [maybeValidate, opts.formstand]
    ),

    move: useCallback(
      (from: number, to: number) => {
        array.move(opts.formstand, from, to);
        keys.current = A.move(keys.current, from, to);
        maybeValidate();
        forceUpdate();
      },
      [maybeValidate, opts.formstand]
    ),

    insert: useCallback(
      (index: number, item: Item) => {
        array.insert(opts.formstand, index, item as any);
        keys.current = A.insert(keys.current, index, simpleId());
        maybeValidate();
        // Will update automatically because the length changed
      },
      [maybeValidate, opts.formstand]
    ),

    unshift: useCallback(
      (item: Item) => {
        array.unshift(opts.formstand, item as any);
        keys.current = A.unshift(keys.current, simpleId());
        maybeValidate();
        // Will update automatically because the length changed
      },
      [maybeValidate, opts.formstand]
    ),

    shift: useCallback(() => {
      array.shift(opts.formstand);
      keys.current = A.shift(keys.current);
      maybeValidate();
      // Will update automatically because the length changed
    }, [maybeValidate, opts.formstand]),

    replace: useCallback(
      (index: number, item: Item) => {
        array.replace(opts.formstand, index, item as any);
        keys.current = A.replace(keys.current, index, simpleId());
        maybeValidate();
        forceUpdate();
      },
      [maybeValidate, opts.formstand]
    ),
  };
};

export const useForm = <Data extends GenericObj, Output>(
  opts: FormstandOptions<Data, Output>
): Formstand<Data, Data, Output> => {
  const storeRef = useRef<Formstand<Data, Data, Output> | null>(null);
  if (!storeRef.current) storeRef.current = createFormstand(opts);
  return storeRef.current as any;
};
