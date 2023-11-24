import type { StoreApi } from "zustand";
import type { FormStoreState } from "./store";
import invariant from "tiny-invariant";

export const STORE_SYMBOL = Symbol("subform store");

type WithStore = { [STORE_SYMBOL]?: StoreApi<FormStoreState<any, any>> };

export const getStore = <T extends WithStore>(subform: T) => {
  const store = subform[STORE_SYMBOL];
  invariant(store, "Subform store not found. Please pass a subform instance.");
  return store;
};
