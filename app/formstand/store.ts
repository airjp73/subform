import { createStore } from "zustand";
import * as R from "remeda";

type Paths<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${"" | `.${Paths<T[K]>}`}`;
    }[keyof T]
  : never;

// type Leaves<T> = T extends object
//   ? {
//       [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never
//         ? ""
//         : `.${Leaves<T[K]>}`}`;
//     }[keyof T]
//   : never;

type DataAtPath<
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

type GenericObj = Record<string, any>;

export type FormStoreState<Data extends GenericObj> = {
  values: Data;
  meta: Record<string, FieldMeta>;
  getMeta: (path: Paths<Data>) => FieldMeta;
  setValue: <Path extends Paths<Data>>(
    path: Path,
    value: DataAtPath<Data, Path>
  ) => void;
  setTouched: (path: Paths<Data>, value: boolean) => void;
  setDirty: (path: Paths<Data>, value: boolean) => void;
  setError: (path: Paths<Data>, error: string) => void;
};

export const makeFormStore = <Data extends GenericObj>(initialValues: Data) =>
  createStore<FormStoreState<Data>>()((set, get) => ({
    values: initialValues,
    meta: {},

    getMeta: (path) => {
      const meta = get().meta[path] ?? defaultMeta;
      return meta;
    },

    setValue: (path, value) => {
      set((prev) => ({
        ...prev,
        values: R.setPath(prev.values, path.split(".") as any, value),
      }));
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
      set((prev) => {
        const newMeta = R.pipe(
          prev.meta[path] ?? defaultMeta,
          R.set("error", error)
        );
        return {
          ...prev,
          meta: R.set(prev.meta, path, newMeta),
        };
      });
    },
  }));
