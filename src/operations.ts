import type { Subform } from "./subform";
import { getStore } from "./internal";
import type { FieldMeta } from "./store";

export const getValue = <Data>(subform: Subform<Data>): Data =>
  getStore(subform).getState().getValue(subform.path);

export const setValue = <Data>(subform: Subform<Data>, value: Data) =>
  getStore(subform).getState().setValue(subform.path, value);

export const getMeta = (subform: Subform<unknown>): FieldMeta =>
  getStore(subform).getState().getMeta(subform.path);

export const setTouched = (subform: Subform<unknown>, touched: boolean) =>
  getStore(subform).getState().setTouched(subform.path, touched);

export const setDirty = (subform: Subform<unknown>, dirty: boolean) =>
  getStore(subform).getState().setDirty(subform.path, dirty);

export const setError = (subform: Subform<unknown>, error: string) =>
  getStore(subform).getState().setError(subform.path, error);

export const handleChange = <Data>(
  subform: Subform<Data>,
  value: Data,
  shouldValidate?: boolean
) =>
  getStore(subform)
    .getState()
    .onChange(subform.path, value as any, shouldValidate);

export const getSubmitAttempted = (subform: Subform<unknown>) =>
  getStore(subform).getState().hasSubmitBeenAttempted;

export const handleBlur = <Data>(
  subform: Subform<Data>,
  shouldValidate?: boolean
) => getStore(subform).getState().onBlur(subform.path, shouldValidate);

export const validate = <Data>(subform: Subform<Data>) =>
  getStore(subform).getState().validate();

export const submit = <Output>(
  subform: Subform<any, Output>,
  submitter: (data: Output) => void | Promise<void>
) => getStore(subform).getState().submit(submitter);

export const array = {
  pop: <Item>(subform: Subform<Item[]>): Item =>
    getStore(subform).getState().array.pop(subform.path),
  push: <Item>(subform: Subform<Item[]>, value: Item): void =>
    getStore(subform).getState().array.push(subform.path, value),
  remove: <Item>(subform: Subform<Item[]>, index: number): Item =>
    getStore(subform).getState().array.remove(subform.path, index),
  swap: (subform: Subform<unknown[]>, indexA: number, indexB: number): void =>
    getStore(subform).getState().array.swap(subform.path, indexA, indexB),
  move: (subform: Subform<unknown[]>, from: number, to: number): void =>
    getStore(subform).getState().array.move(subform.path, from, to),
  insert: <Item>(subform: Subform<Item[]>, index: number, value: Item): void =>
    getStore(subform).getState().array.insert(subform.path, index, value),
  unshift: <Item>(subform: Subform<Item>, value: Item): void =>
    getStore(subform).getState().array.unshift(subform.path, value),
  shift: <Item>(subform: Subform<Item[]>): Item =>
    getStore(subform).getState().array.shift(subform.path),
  replace: <Item>(subform: Subform<Item>, index: number, value: Item): Item =>
    getStore(subform).getState().array.replace(subform.path, index, value),
};
