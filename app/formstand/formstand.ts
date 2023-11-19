import type { StoreApi } from "zustand";
import type { DataAtPath, FormStoreState, GenericObj, Paths } from "./store";
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

export function createFormstand<Data, RootData extends GenericObj, Output>(
  _data: Data,
  prefix: Paths<RootData>,
  store: StoreApi<FormStoreState<RootData, Output>>
): Formstand<Data, RootData, Output> {
  const form: Formstand<Data, RootData, Output> = (name) =>
    createFormstand(
      null as any,
      prefix === "" ? name : (`${prefix}.${name}` as any),
      store
    );

  form.path = prefix as any;
  form[STORE_SYMBOL] = store;

  return form;
}
