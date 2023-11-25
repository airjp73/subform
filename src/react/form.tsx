import type { ChangeEvent, RefCallback } from "react";
import * as R from "remeda";
import { useCallback, useReducer, useRef } from "react";
import type {
  FieldArrayValidationBehaviorConfig,
  FieldMeta,
  SubformOptions,
  GenericObj,
  ValidationBehaviorConfig,
} from "../store";
import { createSubform, type Subform } from "../subform";
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
} from "../operations";
import * as A from "../array";
import { useStore } from "zustand";
import { getStore } from "../internal";
import { simpleId } from "../simpleId";

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
  ref: RefCallback<any>;
};

export type GetInputProps<Data> = Data extends string
  ? (opts?: GetInputPropsOpts<Data>) => GetInputPropsResult
  : (opts: Required<GetInputPropsOpts<Data>>) => GetInputPropsResult;

export type UseFieldResult<Data> = {
  meta: FieldMeta;
  value: Data;
  ref: RefCallback<HTMLElement>;
  setValue: (value: Data) => void;
  getInputProps: GetInputProps<Data>;
  onChange: (value: Data) => void;
  onBlur: () => void;
};

export function useField<Data>(
  subform: Subform<Data>,
  opts: UseFieldOptions = {}
): UseFieldResult<Data> {
  const meta = useMeta(subform);
  const value = useValue(subform);
  const hasSubmitBeenAttempted = useHasSubmitBeenAttempted(subform);
  const formLevelValidationBehavior = useStore(
    getStore(subform),
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
      handleChange(subform, value as any, validateOnChange);
    },
    [subform, validateOnChange]
  );

  const directOnBlur = useCallback(() => {
    handleBlur(subform, validateOnBlur);
  }, [subform, validateOnBlur]);

  const directSetValue = useCallback(
    (value: Data) => {
      setValue(subform, value);
    },
    [subform]
  );

  const ref = useCallback<RefCallback<HTMLElement>>(
    (element) => {
      getStore(subform).getState().syncElement(subform.path, element);
    },
    [subform]
  );

  const getInputProps = useCallback(
    ({ format, parse }: GetInputPropsOpts<Data> = {}): GetInputPropsResult => {
      return {
        name: subform.path,
        onChange: (e: ChangeEvent<any>) => {
          const value = parse ? parse(e.target.value) : e.target.value;
          directOnChange(value);
        },
        onBlur: () => {
          directOnBlur();
        },
        value: (format ? format(value) : value) as string,
        ref: (element: HTMLElement | undefined) => {
          getStore(subform).getState().syncElement(subform.path, element);
        },
      };
    },
    [directOnBlur, directOnChange, subform, value]
  );

  return {
    meta,
    value,
    ref,
    setValue: directSetValue,
    getInputProps: getInputProps as GetInputProps<Data>,
    onChange: directOnChange,
    onBlur: directOnBlur,
  };
}

export type UseFieldArrayOpts = {
  validationBehavior?: FieldArrayValidationBehaviorConfig;
};

export type UseFieldArrayResult<Item> = {
  map: <Output>(
    fn: (subform: Subform<Item>, key: string, index: number) => Output
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
  subform: Subform<Item[]>,
  opts: UseFieldArrayOpts = {}
): UseFieldArrayResult<Item> => {
  const formLevelValidationBehavior = useStore(
    getStore(subform),
    (state) => state.fieldArrayValidationBehavior
  );
  const hasSubmitBeenAttempted = useHasSubmitBeenAttempted(subform);

  const validationBehavior =
    opts.validationBehavior ?? formLevelValidationBehavior;
  const currentBehavior = hasSubmitBeenAttempted
    ? validationBehavior.whenSubmitted
    : validationBehavior.initial;
  const validateOnChange = currentBehavior === "onChange";
  const maybeValidate = useCallback(() => {
    if (validateOnChange) validate(subform);
  }, [subform, validateOnChange]);

  const arrayLength = useStore(
    getStore(subform),
    (state) => (state.getValue(subform.path) as any[]).length
  );

  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const keys = useRef<string[]>([]);

  // If the lengths don't match up it means one of two things
  // 1. The array has been modified outside of this hook
  // 2. We're initializing the array
  if (keys.current.length !== arrayLength)
    keys.current = R.range(0, arrayLength).map(simpleId);

  return {
    error: useError(subform),
    map: useCallback(
      <Output,>(
        fn: (subform: Subform<Item>, key: string, index: number) => Output
      ) => {
        return keys.current.map((key, index) => {
          const nestedSubform = subform(`${index}` as any);
          return fn(nestedSubform, key, index);
        });
      },
      // For some reason, the linter won't let us put `subform` here
      [subform]
    ),
    pop: useCallback(() => {
      array.pop(subform);
      keys.current = A.pop(keys.current);
      maybeValidate();
      // Will update automatically because the length changed
    }, [maybeValidate, subform]),

    push: useCallback(
      (item: Item) => {
        array.push(subform, item as any);
        keys.current = A.push(keys.current, simpleId());
        maybeValidate();
        // Will update automatically because the length changed
      },
      [maybeValidate, subform]
    ),

    remove: useCallback(
      (index: number) => {
        array.remove(subform, index);
        keys.current = A.remove(keys.current, index);
        maybeValidate();
        // Will update automatically because the length changed
      },
      [maybeValidate, subform]
    ),

    swap: useCallback(
      (indexA: number, indexB: number) => {
        array.swap(subform, indexA, indexB);
        keys.current = A.swap(keys.current, indexA, indexB);
        maybeValidate();
        forceUpdate();
      },
      [maybeValidate, subform]
    ),

    move: useCallback(
      (from: number, to: number) => {
        array.move(subform, from, to);
        keys.current = A.move(keys.current, from, to);
        maybeValidate();
        forceUpdate();
      },
      [maybeValidate, subform]
    ),

    insert: useCallback(
      (index: number, item: Item) => {
        array.insert(subform, index, item as any);
        keys.current = A.insert(keys.current, index, simpleId());
        maybeValidate();
        // Will update automatically because the length changed
      },
      [maybeValidate, subform]
    ),

    unshift: useCallback(
      (item: Item) => {
        array.unshift(subform, item as any);
        keys.current = A.unshift(keys.current, simpleId());
        maybeValidate();
        // Will update automatically because the length changed
      },
      [maybeValidate, subform]
    ),

    shift: useCallback(() => {
      array.shift(subform);
      keys.current = A.shift(keys.current);
      maybeValidate();
      // Will update automatically because the length changed
    }, [maybeValidate, subform]),

    replace: useCallback(
      (index: number, item: Item) => {
        array.replace(subform, index, item as any);
        keys.current = A.replace(keys.current, index, simpleId());
        maybeValidate();
        forceUpdate();
      },
      [maybeValidate, subform]
    ),
  };
};

export const useForm = <Data extends GenericObj, Output>(
  opts: SubformOptions<Data, Output>
): Subform<Data, Output> => {
  const storeRef = useRef<Subform<Data, Output> | null>(null);
  if (!storeRef.current) storeRef.current = createSubform(opts);
  return storeRef.current as any;
};
