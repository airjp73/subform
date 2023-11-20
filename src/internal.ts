import type { StoreApi } from "zustand";
import type { FormStoreState } from "./store";
import invariant from "tiny-invariant";

export const STORE_SYMBOL = Symbol("formstand store");

type WithStore = { [STORE_SYMBOL]?: StoreApi<FormStoreState<any, any>> };

export const getStore = <T extends WithStore>(formstand: T) => {
  const store = formstand[STORE_SYMBOL];
  invariant(
    store,
    "Formstand store not found. Please pass a formstand instance."
  );
  return store;
};
