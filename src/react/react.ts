import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Subform } from "../subform";
import type { FieldMeta } from "../store";
import { getStore } from "../internal";
import type { FormEvent } from "react";
import { submit } from "../operations";

export const useValue = <Data>(subform: Subform<Data>): Data =>
  useStore(getStore(subform), (state) => state.getValue(subform.path));

export const useTouched = (subform: Subform<unknown>): boolean =>
  useStore(getStore(subform), (state) => state.getTouched(subform.path));

export const useDirty = (subform: Subform<unknown>): boolean =>
  useStore(getStore(subform), (state) => state.getDirty(subform.path));

export const useError = (subform: Subform<unknown>): string | undefined =>
  useStore(getStore(subform), (state) => state.getError(subform.path));

export const useShouldShowError = (subform: Subform<unknown>): boolean =>
  useStore(getStore(subform), (state) =>
    state.getShouldShowError(subform.path)
  );

export const useMeta = (subform: Subform<unknown>): FieldMeta =>
  useStore(
    getStore(subform),
    useShallow((state) => state.getMeta(subform.path))
  );

export const useIsSubmitting = (subform: Subform<unknown>): boolean =>
  useStore(getStore(subform), (state) => state.isSubmitting);

export const useHasSubmitBeenAttempted = (subform: Subform<unknown>): boolean =>
  useStore(getStore(subform), (state) => state.hasSubmitBeenAttempted);

export const handleSubmit =
  <Output>(
    subform: Subform<any, Output>,
    submitter: (data: Output) => void | Promise<void>
  ) =>
  (e: FormEvent<any>) => {
    e.preventDefault();
    submit(subform, submitter);
  };
