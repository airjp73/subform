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

export const array = {
  pop: <Data extends GenericObj>(formstand: Formstand<Data>) =>
    getStore(formstand).getState().array.pop(formstand.path),
  push: <Data extends GenericObj>(
    formstand: Formstand<Data>,
    value: DataAtPath<Data, Paths<Data>>
  ) => getStore(formstand).getState().array.push(formstand.path, value),
  remove: <Data extends GenericObj>(
    formstand: Formstand<Data>,
    index: number
  ) => getStore(formstand).getState().array.remove(formstand.path, index),
  swap: <Data extends GenericObj>(
    formstand: Formstand<Data>,
    indexA: number,
    indexB: number
  ) =>
    getStore(formstand).getState().array.swap(formstand.path, indexA, indexB),
  move: <Data extends GenericObj>(
    formstand: Formstand<Data>,
    from: number,
    to: number
  ) => getStore(formstand).getState().array.move(formstand.path, from, to),
  insert: <Data extends GenericObj>(
    formstand: Formstand<Data>,
    index: number,
    value: DataAtPath<Data, Paths<Data>>
  ) =>
    getStore(formstand).getState().array.insert(formstand.path, index, value),
  unshift: <Data extends GenericObj>(
    formstand: Formstand<Data>,
    value: DataAtPath<Data, Paths<Data>>
  ) => getStore(formstand).getState().array.unshift(formstand.path, value),
  shift: <Data extends GenericObj>(formstand: Formstand<Data>) =>
    getStore(formstand).getState().array.shift(formstand.path),
  replace: <Data extends GenericObj>(
    formstand: Formstand<Data>,
    index: number,
    value: DataAtPath<Data, Paths<Data>>
  ) =>
    getStore(formstand).getState().array.replace(formstand.path, index, value),
};
