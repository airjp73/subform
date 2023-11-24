import { useStore } from "zustand";
import type { Subform } from "./subform";
import type { DataAtPath, FieldMeta, GenericObj, Paths } from "./store";
import { getStore } from "./internal";
import type { FormEvent } from "react";
import { submit } from "./operations";

export const useValue = <Data extends GenericObj>(
  subform: Subform<Data>
): DataAtPath<Data, Paths<Data>> =>
  useStore(getStore(subform), (state) => state.getValue(subform.path));

export const useMeta = <Data extends GenericObj>(
  subform: Subform<Data>
): FieldMeta =>
  useStore(getStore(subform), (state) => state.getMeta(subform.path));

export const useTouched = <Data extends GenericObj>(
  subform: Subform<Data>
): boolean =>
  useStore(getStore(subform), (state) => state.getMeta(subform.path).touched);

export const useDirty = <Data extends GenericObj>(
  subform: Subform<Data>
): boolean =>
  useStore(getStore(subform), (state) => state.getMeta(subform.path).dirty);

export const useError = <Data extends GenericObj>(
  subform: Subform<Data>
): string | undefined =>
  useStore(getStore(subform), (state) => state.getMeta(subform.path).error);

export const useIsSubmitting = <Data extends GenericObj>(
  subform: Subform<Data>
): boolean => useStore(getStore(subform), (state) => state.isSubmitting);

export const useHasSubmitBeenAttempted = <Data extends GenericObj>(
  subform: Subform<Data>
): boolean =>
  useStore(getStore(subform), (state) => state.hasSubmitBeenAttempted);

export const handleSubmit =
  <Output>(
    subform: Subform<any, any, Output>,
    submitter: (data: Output) => void | Promise<void>
  ) =>
  (e: FormEvent<any>) => {
    e.preventDefault();
    submit(subform, submitter);
  };
