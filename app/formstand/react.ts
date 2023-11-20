import { useStore } from "zustand";
import type { Formstand } from "./formstand";
import type { DataAtPath, FieldMeta, GenericObj, Paths } from "./store";
import { getStore } from "./internal";
import type { FormEvent } from "react";
import { submit } from "./operations";

export const useValue = <Data extends GenericObj>(
  formstand: Formstand<Data>
): DataAtPath<Data, Paths<Data>> =>
  useStore(getStore(formstand), (state) => state.getValue(formstand.path));

export const useMeta = <Data extends GenericObj>(
  formstand: Formstand<Data>
): FieldMeta =>
  useStore(getStore(formstand), (state) => state.getMeta(formstand.path));

export const useTouched = <Data extends GenericObj>(
  formstand: Formstand<Data>
): boolean =>
  useStore(
    getStore(formstand),
    (state) => state.getMeta(formstand.path).touched
  );

export const useDirty = <Data extends GenericObj>(
  formstand: Formstand<Data>
): boolean =>
  useStore(getStore(formstand), (state) => state.getMeta(formstand.path).dirty);

export const useError = <Data extends GenericObj>(
  formstand: Formstand<Data>
): string | undefined =>
  useStore(getStore(formstand), (state) => state.getMeta(formstand.path).error);

export const useIsSubmitting = <Data extends GenericObj>(
  formstand: Formstand<Data>
): boolean => useStore(getStore(formstand), (state) => state.isSubmitting);

export const useHasSubmitBeenAttempted = <Data extends GenericObj>(
  formstand: Formstand<Data>
): boolean =>
  useStore(getStore(formstand), (state) => state.hasSubmitBeenAttempted);

export const handleSubmit =
  <Output>(
    formstand: Formstand<any, any, Output>,
    submitter: (data: Output) => void | Promise<void>
  ) =>
  (e: FormEvent<any>) => {
    e.preventDefault();
    submit(formstand, submitter);
  };
