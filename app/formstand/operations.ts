import type { Formstand } from "./formstand";
import { getStore } from "./internal";
import type { DataAtPath, FieldMeta, GenericObj, Paths } from "./store";

export const getValue = <Data extends GenericObj>(
  formstand: Formstand<Data>
): DataAtPath<Data, Paths<Data>> =>
  getStore(formstand).getState().getValue(formstand.path);

export const setValue = <Data extends GenericObj>(
  formstand: Formstand<Data>,
  value: DataAtPath<Data, Paths<Data>>
) => getStore(formstand).getState().setValue(formstand.path, value);

export const getMeta = <Data extends GenericObj>(
  formstand: Formstand<Data>
): FieldMeta => getStore(formstand).getState().getMeta(formstand.path);

export const setTouched = <Data extends GenericObj>(
  formstand: Formstand<Data>,
  touched: boolean
) => getStore(formstand).getState().setTouched(formstand.path, touched);

export const setDirty = <Data extends GenericObj>(
  formstand: Formstand<Data>,
  dirty: boolean
) => getStore(formstand).getState().setDirty(formstand.path, dirty);

export const setError = <Data extends GenericObj>(
  formstand: Formstand<Data>,
  error: string
) => getStore(formstand).getState().setError(formstand.path, error);

export const handleChange = <Data extends GenericObj>(
  formstand: Formstand<Data>,
  value: DataAtPath<Data, Paths<Data>>,
  shouldValidate?: boolean
) =>
  getStore(formstand)
    .getState()
    .onChange(formstand.path, value, shouldValidate);

export const getSubmitAttempted = <Data extends GenericObj>(
  formstand: Formstand<Data>
) => getStore(formstand).getState().hasSubmitBeenAttempted;

export const handleBlur = <Data extends GenericObj>(
  formstand: Formstand<Data>,
  shouldValidate?: boolean
) => getStore(formstand).getState().onBlur(formstand.path, shouldValidate);

export const validate = <Data extends GenericObj>(formstand: Formstand<Data>) =>
  getStore(formstand).getState().validate();

export const submit = <Output>(
  formstand: Formstand<any, any, Output>,
  submitter: (data: Output) => void | Promise<void>
) => getStore(formstand).getState().submit(submitter);
