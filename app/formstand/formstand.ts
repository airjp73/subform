import type { StoreApi } from "zustand";
import {
  makeFormStore,
  type DataAtPath,
  type FormStoreState,
  type FormstandOptions,
  type GenericObj,
  type Paths,
} from "./store";
import { STORE_SYMBOL } from "./internal";

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
  [STORE_SYMBOL]: StoreApi<FormStoreState<any, unknown>>;
}

function createFormstandInternal<Data, RootData extends GenericObj, Output>(
  _data: Data,
  prefix: Paths<RootData>,
  store: StoreApi<FormStoreState<RootData, Output>>
): Formstand<Data, RootData, Output> {
  const form: Formstand<Data, RootData, Output> = (name) =>
    createFormstandInternal(
      null as any,
      prefix === "" ? name : (`${prefix}.${name}` as any),
      store
    );

  form.path = prefix as any;
  form[STORE_SYMBOL] = store;

  return form;
}

export function createFormstand<Data extends GenericObj, Output>(
  opts: FormstandOptions<Data, Output>
): Formstand<Data, Data, Output> {
  return createFormstandInternal(null as any, "" as any, makeFormStore(opts));
}
