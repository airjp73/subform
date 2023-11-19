import { createStore } from "zustand/vanilla";
import * as R from "remeda";
import invariant from "tiny-invariant";
import { devtools } from "zustand/middleware";

export type Paths<T> = T extends Array<infer Item>
  ? `${number}${"" | `.${Paths<Item>}`}`
  : T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${"" | `.${Paths<T[K]>}`}`;
    }[keyof T]
  : never;

export type FieldErrors = Record<string, string>;
export type ValidatorResult<T> = { errors: FieldErrors } | { data: T };
export type Validator<T> = (
  value: unknown
) => ValidatorResult<T> | Promise<ValidatorResult<T>>;

type ToKey<T> = T extends `${infer Key extends number}` ? Key : T;

type DataAtArrayPath<Item, Key, Path extends string> = ToKey<Key> extends number
  ? DataAtPath<Item, Path>
  : never;

type NestedPath<
  Data,
  Key extends string,
  Rest extends string
> = Data extends Array<infer Item>
  ? DataAtArrayPath<Item, Key, Rest>
  : Key extends keyof Data
  ? DataAtPath<Data[Key], Rest>
  : never;

type LeafPath<Data, Path extends string> = ToKey<Path> extends keyof Data
  ? Data[ToKey<Path>]
  : never;

export type DataAtPath<
  Data,
  Path extends string
> = Path extends `${infer Key}.${infer Rest}`
  ? NestedPath<Data, Key, Rest>
  : LeafPath<Data, Path>;

type t = DataAtPath<{ a: number[] }, "a.0">;

export type FieldMeta = {
  touched: boolean;
  dirty: boolean;
  error?: string;
};
export const defaultMeta = {
  touched: false,
  dirty: false,
  error: undefined,
};

export type ValidationBehavior = "onChange" | "onBlur" | "onSubmit";

export type ValidationBehaviorConfig = {
  initial: ValidationBehavior;
  whenTouched: ValidationBehavior;
  whenSubmitted: ValidationBehavior;
};

export const defaultValidationBehavior: ValidationBehaviorConfig = {
  initial: "onBlur",
  whenTouched: "onChange",
  whenSubmitted: "onChange",
};

export type GenericObj = Record<string, any>;

export type FormStoreState<Data extends GenericObj, Output> = {
  validator: Validator<Output>;
  values: Data;
  errors: FieldErrors;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isSubmitting: boolean;
  hasSubmitBeenAttempted: boolean;
  validationBehavior: ValidationBehaviorConfig;

  validate: () => Promise<ValidatorResult<Output>>;
  submit: (submitter: (data: Output) => void | Promise<void>) => Promise<void>;
  onChange: <Path extends Paths<Data>>(
    path: Path,
    value: DataAtPath<Data, Path>,
    shouldValidate?: boolean
  ) => void;
  onBlur: <Path extends Paths<Data>>(
    path: Path,
    shouldValidate?: boolean
  ) => void;

  getValue: <Path extends Paths<Data>>(path: Path) => DataAtPath<Data, Path>;
  setValue: <Path extends Paths<Data>>(
    path: Path,
    value: DataAtPath<Data, Path>
  ) => void;
  getMeta: (path: Paths<Data>) => FieldMeta;
  setTouched: (path: Paths<Data>, value: boolean) => void;
  setDirty: (path: Paths<Data>, value: boolean) => void;
  setError: (path: Paths<Data>, error: string) => void;
};

export type FormstandOptions<Data extends GenericObj, Output> = {
  initialValues: Data;
  validator: Validator<Output>;
  validationBehavior?: ValidationBehaviorConfig;
};

const getPathSegments = (path: string): (string | number)[] =>
  path.split(".").map((segment) => {
    const parsed = Number(segment);
    return isNaN(parsed) ? segment : parsed;
  });

export const makeFormStore = <Data extends GenericObj, Output>({
  initialValues,
  validator,
  validationBehavior = defaultValidationBehavior,
}: FormstandOptions<Data, Output>) =>
  createStore<FormStoreState<Data, Output>>()(
    devtools((set, get) => ({
      validator,
      values: initialValues,
      errors: {},
      touched: {},
      dirty: {},
      isSubmitting: false,
      hasSubmitBeenAttempted: false,
      validationBehavior,

      validate: async () => {
        const result = await get().validator(get().values);
        set((prev) => ({
          ...prev,
          errors: "errors" in result ? result.errors : {},
        }));
        return result;
      },
      submit: async (submitFunction) => {
        set((prev) =>
          R.pipe(
            prev,
            R.set("isSubmitting", true),
            R.set("hasSubmitBeenAttempted", true)
          )
        );
        const result = await get().validate();
        if ("data" in result) {
          await submitFunction(result.data);
        }
        set((prev) => R.set(prev, "isSubmitting", false));
      },
      getValue: (path) => {
        const value = R.pathOr(
          get().values,
          getPathSegments(path) as any,
          undefined as any
        );
        invariant(
          value !== undefined,
          `Value at path ${path} is undefined. Please set a default value.`
        );
        return value;
      },
      setValue: (path, value) => {
        set((prev) => ({
          ...prev,
          values: R.setPath(prev.values, getPathSegments(path) as any, value),
        }));
      },
      onChange: (path, value, shouldValidate) => {
        set((prev) => ({
          ...prev,
          values: R.setPath(prev.values, getPathSegments(path) as any, value),
          dirty: R.set(prev.dirty, path as any, true),
        }));
        if (shouldValidate) get().validate();
      },
      onBlur: (path, shouldValidate) => {
        set((prev) => ({
          ...prev,
          touched: R.set(prev.touched, path as any, true),
        }));
        if (shouldValidate) get().validate();
      },

      getMeta: (path) => {
        return {
          dirty: get().dirty[path] ?? defaultMeta.dirty,
          touched:
            (get().touched[path] ?? defaultMeta.touched) ||
            get().hasSubmitBeenAttempted,
          error: get().errors[path] ?? defaultMeta.error,
        };
      },
      setTouched: (path, value) => {
        set((prev) => {
          return {
            ...prev,
            touched: R.set(prev.touched, path, value),
          };
        });
      },
      setDirty: (path, value) => {
        set((prev) => {
          return {
            ...prev,
            dirty: R.set(prev.dirty, path, value),
          };
        });
      },
      setError: (path, error) => {
        set((prev) => {
          return {
            ...prev,
            errors: R.set(prev.errors, path, error),
          };
        });
      },
    }))
  );
