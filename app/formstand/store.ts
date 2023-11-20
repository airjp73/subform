import { createStore } from "zustand/vanilla";
import * as R from "remeda";
import invariant from "tiny-invariant";
import { devtools } from "zustand/middleware";

type TupleIndeces<T extends any[]> = T extends [any, ...infer Rest]
  ? TupleIndeces<Rest> | Rest["length"]
  : never;

export type Paths<T> = T extends [any, ...any[]]
  ? {
      [K in TupleIndeces<T>]: `${K}` | `${K}.${Paths<T[K]>}`;
    }[TupleIndeces<T>]
  : T extends Array<infer Item>
  ? `${number}${"" | `.${Paths<Item>}`}`
  : T extends Date
  ? never
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

  array: {
    push: <Path extends Paths<Data>>(
      path: Path,
      value: DataAtPath<Data, Path>[number]
    ) => void;
    remove: <Path extends Paths<Data>>(
      path: Path,
      index: number
    ) => DataAtPath<Data, Path>[number];
    swap: <Path extends Paths<Data>>(
      path: Path,
      indexA: number,
      indexB: number
    ) => void;
    move: <Path extends Paths<Data>>(
      path: Path,
      from: number,
      to: number
    ) => void;
    insert: <Path extends Paths<Data>>(
      path: Path,
      index: number,
      value: DataAtPath<Data, Path>[number]
    ) => void;
    unshift: <Path extends Paths<Data>>(
      path: Path,
      value: DataAtPath<Data, Path>[number]
    ) => void;
    pop: <Path extends Paths<Data>>(
      path: Path
    ) => DataAtPath<Data, Path>[number];
    shift: <Path extends Paths<Data>>(
      path: Path
    ) => DataAtPath<Data, Path>[number];
    replace: <Path extends Paths<Data>>(
      path: Path,
      index: number,
      value: DataAtPath<Data, Path>[number]
    ) => void;
  };
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

      array: {
        pop: (path) => {
          const segments = getPathSegments(path);

          set((prev) => {
            const array = R.pathOr(prev.values, segments as any, [] as any);
            if (!Array.isArray(array)) return prev;

            return {
              ...prev,
              values: R.setPath(
                prev.values,
                segments as any,
                R.splice(array, array.length - 1, 1, []) as any
              ),
            };
          });
        },
        insert: (path, index, value) => {
          const segments = getPathSegments(path);

          set((prev) => {
            const array = R.pathOr(prev.values, segments as any, [] as any);
            if (!Array.isArray(array)) return prev;

            return {
              ...prev,
              values: R.setPath(
                prev.values,
                segments as any,
                R.splice(array, index, 0, [value]) as any
              ),
            };
          });
        },
        move: (path, from, to) => {
          const segments = getPathSegments(path);

          set((prev) => {
            const array = R.pathOr(prev.values, segments as any, [] as any);
            if (!Array.isArray(array)) return prev;

            const movedItem = array[from];

            return {
              ...prev,
              values: R.setPath(
                prev.values,
                segments as any,
                R.pipe(
                  array,
                  R.splice(from, 1, []),
                  R.splice(to, 0, [movedItem])
                ) as any
              ),
            };
          });
        },

        push: (path, value) => {
          const segments = getPathSegments(path);

          set((prev) => {
            const array = R.pathOr(prev.values, segments as any, [] as any);
            if (!Array.isArray(array)) return prev;

            return {
              ...prev,
              values: R.setPath(
                prev.values,
                segments as any,
                R.splice(array, array.length, 0, [value]) as any
              ),
            };
          });
        },

        remove: (path, index) => {
          const segments = getPathSegments(path);

          set((prev) => {
            const array = R.pathOr(prev.values, segments as any, [] as any);
            if (!Array.isArray(array)) return prev;

            return {
              ...prev,
              values: R.setPath(
                prev.values,
                segments as any,
                R.splice(array, index, 1, []) as any
              ),
            };
          });
        },

        replace: (path, index, value) => {
          const segments = getPathSegments(path);

          set((prev) => {
            const array = R.pathOr(prev.values, segments as any, [] as any);
            if (!Array.isArray(array)) return prev;

            return {
              ...prev,
              values: R.setPath(
                prev.values,
                segments as any,
                R.splice(array, index, 1, [value]) as any
              ),
            };
          });
        },

        shift: (path) => {
          const segments = getPathSegments(path);

          set((prev) => {
            const array = R.pathOr(prev.values, segments as any, [] as any);
            if (!Array.isArray(array)) return prev;

            return {
              ...prev,
              values: R.setPath(
                prev.values,
                segments as any,
                R.splice(array, 0, 1, []) as any
              ),
            };
          });
        },

        swap: (path, indexA, indexB) => {
          const segments = getPathSegments(path);

          set((prev) => {
            const array = R.pathOr(prev.values, segments as any, [] as any);
            if (!Array.isArray(array)) return prev;

            const itemA = array[indexA];
            const itemB = array[indexB];

            return {
              ...prev,
              values: R.setPath(
                prev.values,
                segments as any,
                R.pipe(
                  array,
                  R.splice(indexA, 1, [itemB]),
                  R.splice(indexB, 1, [itemA])
                ) as any
              ),
            };
          });
        },

        unshift: (path, value) => {
          const segments = getPathSegments(path);

          set((prev) => {
            const array = R.pathOr(prev.values, segments as any, [] as any);
            if (!Array.isArray(array)) return prev;

            return {
              ...prev,
              values: R.setPath(
                prev.values,
                segments as any,
                R.splice(array, 0, 0, [value]) as any
              ),
            };
          });
        },
      },
    }))
  );
