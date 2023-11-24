import type { Subform } from "./subform";
import { getStore } from "./internal";
import type { DataAtPath, FieldMeta, GenericObj, Paths } from "./store";

export const getValue = <Data extends GenericObj>(
  subform: Subform<Data>
): DataAtPath<Data, Paths<Data>> =>
  getStore(subform).getState().getValue(subform.path);

export const setValue = <Data extends GenericObj>(
  subform: Subform<Data>,
  value: DataAtPath<Data, Paths<Data>>
) => getStore(subform).getState().setValue(subform.path, value);

export const getMeta = <Data extends GenericObj>(
  subform: Subform<Data>
): FieldMeta => getStore(subform).getState().getMeta(subform.path);

export const setTouched = <Data extends GenericObj>(
  subform: Subform<Data>,
  touched: boolean
) => getStore(subform).getState().setTouched(subform.path, touched);

export const setDirty = <Data extends GenericObj>(
  subform: Subform<Data>,
  dirty: boolean
) => getStore(subform).getState().setDirty(subform.path, dirty);

export const setError = <Data extends GenericObj>(
  subform: Subform<Data>,
  error: string
) => getStore(subform).getState().setError(subform.path, error);

export const handleChange = <Data extends GenericObj>(
  subform: Subform<Data>,
  value: DataAtPath<Data, Paths<Data>>,
  shouldValidate?: boolean
) => getStore(subform).getState().onChange(subform.path, value, shouldValidate);

export const getSubmitAttempted = <Data extends GenericObj>(
  subform: Subform<Data>
) => getStore(subform).getState().hasSubmitBeenAttempted;

export const handleBlur = <Data extends GenericObj>(
  subform: Subform<Data>,
  shouldValidate?: boolean
) => getStore(subform).getState().onBlur(subform.path, shouldValidate);

export const validate = <Data extends GenericObj>(subform: Subform<Data>) =>
  getStore(subform).getState().validate();

export const submit = <Output>(
  subform: Subform<any, any, Output>,
  submitter: (data: Output) => void | Promise<void>
) => getStore(subform).getState().submit(submitter);

export const array = {
  pop: <Data extends GenericObj>(subform: Subform<Data>) =>
    getStore(subform).getState().array.pop(subform.path),
  push: <Data extends GenericObj>(
    subform: Subform<Data>,
    value: DataAtPath<Data, Paths<Data>>
  ) => getStore(subform).getState().array.push(subform.path, value),
  remove: <Data extends GenericObj>(subform: Subform<Data>, index: number) =>
    getStore(subform).getState().array.remove(subform.path, index),
  swap: <Data extends GenericObj>(
    subform: Subform<Data>,
    indexA: number,
    indexB: number
  ) => getStore(subform).getState().array.swap(subform.path, indexA, indexB),
  move: <Data extends GenericObj>(
    subform: Subform<Data>,
    from: number,
    to: number
  ) => getStore(subform).getState().array.move(subform.path, from, to),
  insert: <Data extends GenericObj>(
    subform: Subform<Data>,
    index: number,
    value: DataAtPath<Data, Paths<Data>>
  ) => getStore(subform).getState().array.insert(subform.path, index, value),
  unshift: <Data extends GenericObj>(
    subform: Subform<Data>,
    value: DataAtPath<Data, Paths<Data>>
  ) => getStore(subform).getState().array.unshift(subform.path, value),
  shift: <Data extends GenericObj>(subform: Subform<Data>) =>
    getStore(subform).getState().array.shift(subform.path),
  replace: <Data extends GenericObj>(
    subform: Subform<Data>,
    index: number,
    value: DataAtPath<Data, Paths<Data>>
  ) => getStore(subform).getState().array.replace(subform.path, index, value),
};
