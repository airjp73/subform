import { createStore } from "zustand/vanilla";
import * as R from "remeda";
import invariant from "tiny-invariant";
import { devtools } from "zustand/middleware";
import * as A from "./array";

type TupleIndeces<T extends any[]> = T extends [any, ...infer Rest]
  ? TupleIndeces<Rest> | Rest["length"]
  : never;

type DepthLimit = [6, 5, 4, 3, 2, 1, 0];

export type Paths<T, Depth = DepthLimit> = Depth extends []
  ? never
  : Depth extends [any, ...infer Rest]
  ? T extends [any, ...any[]]
    ? {
        [K in TupleIndeces<T>]: `${K}` | `${K}.${Paths<T[K], Rest>}`;
      }[TupleIndeces<T>]
    : T extends Array<infer Item>
    ? `${number}${"" | `.${Paths<Item, Rest>}`}`
    : T extends Date
    ? never
    : T extends object
    ? {
        [K in keyof T]: `${Exclude<K, symbol>}${"" | `.${Paths<T[K], Rest>}`}`;
      }[keyof T]
    : never
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
  shouldShowError: boolean;
};
export const defaultMeta: FieldMeta = {
  touched: false,
  dirty: false,
  error: undefined,
  shouldShowError: false,
};

export type ValidationBehavior = "onChange" | "onBlur" | "onSubmit";

export type ValidationBehaviorConfig = {
  initial: ValidationBehavior;
  whenTouched: ValidationBehavior;
  whenSubmitted: ValidationBehavior;
};

export type FieldArrayValidationBehaviorConfig = {
  initial: "onChange" | "onSubmit";
  whenSubmitted: "onChange" | "onSubmit";
};

export const defaultValidationBehavior: ValidationBehaviorConfig = {
  initial: "onBlur",
  whenTouched: "onChange",
  whenSubmitted: "onChange",
};

export const defaultFieldArrayValidationBehavior: FieldArrayValidationBehaviorConfig =
  {
    initial: "onChange",
    whenSubmitted: "onChange",
  };

export type GenericObj = Record<string, any>;

export type FormStoreState<Data extends GenericObj, Output> = {
  validator: Validator<Output>;
  values: Data;
  errors: FieldErrors;
  elementsRef: Record<string, HTMLElement>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isSubmitting: boolean;
  hasSubmitBeenAttempted: boolean;
  validationBehavior: ValidationBehaviorConfig;
  fieldArrayValidationBehavior: FieldArrayValidationBehaviorConfig;

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
  getShouldShowError: (path: Paths<Data>) => boolean;
  getTouched: (path: Paths<Data>) => boolean;
  getDirty: (path: Paths<Data>) => boolean;
  getError: (path: Paths<Data>) => string | undefined;
  getMeta: (path: Paths<Data>) => FieldMeta;
  setTouched: (path: Paths<Data>, value: boolean) => void;
  setDirty: (path: Paths<Data>, value: boolean) => void;
  setError: (path: Paths<Data>, error: string) => void;

  syncElement: (path: Paths<Data>, element: unknown | null | undefined) => void;

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
    ) => DataAtPath<Data, Path>[number];
  };
};

export type SubformOptions<Data extends GenericObj, Output> = {
  initialValues: Data;
  validator: Validator<Output>;
  validationBehavior?: ValidationBehaviorConfig;
  fieldArrayValidationBehavior?: FieldArrayValidationBehaviorConfig;
};

const getPathSegments = (path: string): (string | number)[] =>
  path.split(".").map((segment) => {
    const parsed = Number(segment);
    return isNaN(parsed) ? segment : parsed;
  });

const focusFirstInvalidElement = (
  elementsRef: Record<string, unknown>,
  errors: FieldErrors
) => {
  const nameSelector = Object.keys(errors)
    .filter((key) => key in elementsRef)
    .map((key) => `[name="${key}"]`)
    .join(",");
  const matches = [...document.querySelectorAll(nameSelector)];
  const firstInvalidFocusable = matches.find((match) => {
    const name = match.getAttribute("name");
    invariant(name);
    return elementsRef[name] === match && "focus" in match;
  });
  (firstInvalidFocusable as any)?.focus();
};

export const makeFormStore = <Data extends GenericObj, Output>({
  initialValues,
  validator,
  validationBehavior = defaultValidationBehavior,
  fieldArrayValidationBehavior = defaultFieldArrayValidationBehavior,
}: SubformOptions<Data, Output>) =>
  createStore<FormStoreState<Data, Output>>()(
    devtools((set, get) => ({
      validator,
      values: initialValues,
      errors: {},
      touched: {},
      dirty: {},
      elementsRef: {},
      isSubmitting: false,
      hasSubmitBeenAttempted: false,
      validationBehavior,
      fieldArrayValidationBehavior,

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
        } else {
          focusFirstInvalidElement(get().elementsRef, result.errors);
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

      getShouldShowError: (path) => {
        return get().getTouched(path) || get().hasSubmitBeenAttempted;
      },
      getTouched: (path) => {
        return get().touched[path] ?? defaultMeta.touched;
      },
      getDirty: (path) => {
        return get().dirty[path] ?? defaultMeta.dirty;
      },
      getError: (path) => {
        return get().errors[path] ?? defaultMeta.error;
      },
      getMeta: (path) => {
        return {
          touched: get().getTouched(path),
          dirty: get().getDirty(path),
          error: get().getError(path),
          shouldShowError: get().getShouldShowError(path),
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

      syncElement: (path, element) => {
        // This elementsRef is used as a ref, and should never trigger an update,
        // we won't be using `set` and instead mutate the object directly.
        if (element == null) {
          delete get().elementsRef[path];
          return;
        }

        // @ts-ignore
        get().elementsRef[path] = element;
      },

      array: {
        pop: (path) => {
          const segments = getPathSegments(path);
          const array = R.pathOr(get().values, segments as any, [] as any);
          invariant(
            Array.isArray(array),
            `Value at path ${path} is not an array.`
          );

          const poppedItem = array[array.length - 1];
          const nextArray = A.pop(array);

          set((prev) => ({
            ...prev,
            values: R.setPath(prev.values, segments as any, nextArray as any),
          }));

          return poppedItem;
        },
        insert: (path, index, value) => {
          const segments = getPathSegments(path);

          const array = R.pathOr(get().values, segments as any, [] as any);
          invariant(
            Array.isArray(array),
            `Value at path ${path} is not an array.`
          );

          set((prev) => ({
            ...prev,
            values: R.setPath(
              prev.values,
              segments as any,
              A.insert(array, index, value) as any
            ),
          }));
        },
        move: (path, from, to) => {
          const segments = getPathSegments(path);

          const array = R.pathOr(get().values, segments as any, [] as any);
          invariant(
            Array.isArray(array),
            `Value at path ${path} is not an array.`
          );

          set((prev) => ({
            ...prev,
            values: R.setPath(
              prev.values,
              segments as any,
              A.move(array, from, to) as any
            ),
          }));
        },

        push: (path, value) => {
          const segments = getPathSegments(path);

          const array = R.pathOr(get().values, segments as any, [] as any);
          invariant(
            Array.isArray(array),
            `Value at path ${path} is not an array.`
          );

          set((prev) => ({
            ...prev,
            values: R.setPath(
              prev.values,
              segments as any,
              A.push(array, value) as any
            ),
          }));
        },

        remove: (path, index) => {
          const segments = getPathSegments(path);

          const array = R.pathOr(get().values, segments as any, [] as any);
          invariant(
            Array.isArray(array),
            `Value at path ${path} is not an array.`
          );

          const removedItem = array[index];

          set((prev) => ({
            ...prev,
            values: R.setPath(
              prev.values,
              segments as any,
              A.remove(array, index) as any
            ),
          }));

          return removedItem;
        },

        replace: (path, index, value) => {
          const segments = getPathSegments(path);

          const array = R.pathOr(get().values, segments as any, [] as any);
          invariant(
            Array.isArray(array),
            `Value at path ${path} is not an array.`
          );

          const replacedItem = array[index];

          set((prev) => ({
            ...prev,
            values: R.setPath(
              prev.values,
              segments as any,
              A.replace(array, index, value) as any
            ),
          }));

          return replacedItem;
        },

        shift: (path) => {
          const segments = getPathSegments(path);

          const array = R.pathOr(get().values, segments as any, [] as any);
          invariant(
            Array.isArray(array),
            `Value at path ${path} is not an array.`
          );

          const shiftedItem = array[0];

          set((prev) => ({
            ...prev,
            values: R.setPath(
              prev.values,
              segments as any,
              A.shift(array) as any
            ),
          }));

          return shiftedItem;
        },

        swap: (path, indexA, indexB) => {
          const segments = getPathSegments(path);

          const array = R.pathOr(get().values, segments as any, [] as any);
          invariant(
            Array.isArray(array),
            `Value at path ${path} is not an array.`
          );

          set((prev) => ({
            ...prev,
            values: R.setPath(
              prev.values,
              segments as any,
              A.swap(array, indexA, indexB) as any
            ),
          }));
        },

        unshift: (path, value) => {
          const segments = getPathSegments(path);

          const array = R.pathOr(get().values, segments as any, [] as any);
          invariant(
            Array.isArray(array),
            `Value at path ${path} is not an array.`
          );

          set((prev) => ({
            ...prev,
            values: R.setPath(
              prev.values,
              segments as any,
              A.unshift(array, value) as any
            ),
          }));
        },
      },
    }))
  );
