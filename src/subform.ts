import type { StoreApi } from "zustand";
import {
  makeFormStore,
  type DataAtPath,
  type FormStoreState,
  type SubformOptions,
  type GenericObj,
  type Paths,
} from "./store";
import { STORE_SYMBOL } from "./internal";

export interface Subform<
  Data,
  RootData extends GenericObj = GenericObj,
  Output = unknown
> {
  <N extends Paths<Data>>(name: N): Subform<
    DataAtPath<Data, N>,
    RootData,
    Output
  >;
  path: Paths<Data>;
  [STORE_SYMBOL]: StoreApi<FormStoreState<any, unknown>>;
}

function createSubformInternal<Data, RootData extends GenericObj, Output>(
  _data: Data,
  prefix: Paths<RootData>,
  store: StoreApi<FormStoreState<RootData, Output>>
): Subform<Data, RootData, Output> {
  const form: Subform<Data, RootData, Output> = (name) =>
    createSubformInternal(
      null as any,
      prefix === "" ? name : (`${prefix}.${name}` as any),
      store
    );

  form.path = prefix as any;
  form[STORE_SYMBOL] = store;

  return form;
}

export function createSubform<Data extends GenericObj, Output>(
  opts: SubformOptions<Data, Output>
): Subform<Data, Data, Output> {
  return createSubformInternal(null as any, "" as any, makeFormStore(opts));
}
