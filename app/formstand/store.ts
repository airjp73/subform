import { createStore } from "zustand/vanilla";
import * as R from "remeda";
import invariant from "tiny-invariant";

export type Paths<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${"" | `.${Paths<T[K]>}`}`;
    }[keyof T]
  : never;

export type FieldErrors = Record<string, string>;
export type ValidatorResult<T> = { errors: FieldErrors } | { data: T };
export type Validator<T> = (
  value: unknown
) => ValidatorResult<T> | Promise<ValidatorResult<T>>;

export type DataAtPath<
  Data,
  Path extends string
> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof Data
    ? DataAtPath<Data[Key], Rest>
    : never
  : Path extends keyof Data
  ? Data[Path]
  : never;

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

export type GenericObj = Record<string, any>;

export type FormStoreState<Data extends GenericObj, Output> = {
  validator: Validator<Output>;
  values: Data;
  meta: Record<string, FieldMeta>;
  isSubmitting: boolean;

  validate: () => Promise<ValidatorResult<Output>>;
  submit: (submitter: (data: Output) => void | Promise<void>) => Promise<void>;
  onChange: <Path extends Paths<Data>>(
    path: Path,
    value: DataAtPath<Data, Path>
  ) => void;
  onBlur: <Path extends Paths<Data>>(path: Path) => void;

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
};

const updateError = <State extends FormStoreState<any, unknown>>(
  path: string,
  error: string,
  prev: State
): State => {
  const newMeta = R.pipe(prev.meta[path] ?? defaultMeta, R.set("error", error));
  return {
    ...prev,
    meta: R.set(prev.meta, path, newMeta),
  };
};

export const makeFormStore = <Data extends GenericObj, Output>({
  initialValues,
  validator,
}: FormstandOptions<Data, Output>) =>
  createStore<FormStoreState<Data, Output>>()((set, get) => ({
    isSubmitting: false,
    validator,
    values: initialValues,
    meta: {},

    validate: async () => {
      const result = await get().validator(get().values);
      if ("errors" in result) {
        set((prev) =>
          Object.entries(result.errors).reduce(
            (state, [path, error]) => updateError(path, error, state),
            prev
          )
        );
      }
      return result;
    },
    submit: async (submitter) => {
      set((prev) => R.set(prev, "isSubmitting", true));
      const result = await get().validate();
      if ("data" in result) {
        await submitter(result.data);
      }
      set((prev) => R.set(prev, "isSubmitting", false));
    },
    getValue: (path) => {
      const value = R.pathOr(
        get().values,
        path.split(".") as any,
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
        values: R.setPath(prev.values, path.split(".") as any, value),
      }));
    },
    onChange: (path, value) => {
      set((prev) => ({
        ...prev,
        values: R.setPath(prev.values, path.split(".") as any, value),
        meta: R.set(prev.meta, path as any, {
          ...prev.getMeta(path),
          dirty: true,
        }),
      }));
    },
    onBlur: (path) => {
      set((prev) => ({
        ...prev,
        meta: R.set(prev.meta, path as any, {
          ...prev.getMeta(path),
          touched: true,
        }),
      }));
    },

    getMeta: (path) => {
      const meta = get().meta[path] ?? defaultMeta;
      return meta;
    },
    setTouched: (path, value) => {
      set((prev) => {
        const newMeta = R.pipe(
          prev.meta[path] ?? defaultMeta,
          R.set("touched", value)
        );
        return {
          ...prev,
          meta: R.set(prev.meta, path, newMeta),
        };
      });
    },
    setDirty: (path, value) => {
      set((prev) => {
        const newMeta = R.set(prev.getMeta(path), "dirty", value);
        return {
          ...prev,
          meta: R.set(prev.meta, path, newMeta),
        };
      });
    },
    setError: (path, error) => {
      set((prev) => updateError(path, error, prev));
    },
  }));
