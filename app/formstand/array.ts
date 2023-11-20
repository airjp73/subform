import * as R from "remeda";

export const pop = <T>(array: T[]): T[] =>
  R.splice(array, array.length - 1, 1, []);

export const push = <T>(array: T[], value: T): T[] =>
  R.splice(array, array.length, 0, [value]);

export const remove = <T>(array: T[], index: number): T[] =>
  R.splice(array, index, 1, []);

export const swap = <T>(array: T[], indexA: number, indexB: number): T[] => {
  const itemA = array[indexA];
  const itemB = array[indexB];

  return R.pipe(
    array,
    R.splice(indexA, 1, [itemB]),
    R.splice(indexB, 1, [itemA])
  );
};

export const move = <T>(array: T[], from: number, to: number): T[] => {
  const movedItem = array[from];
  return R.pipe(
    array,
    R.splice(from, 1, [] as T[]),
    R.splice(to, 0, [movedItem])
  );
};

export const insert = <T>(array: T[], index: number, value: T): T[] =>
  R.splice(array, index, 0, [value]);

export const unshift = <T>(array: T[], value: T): T[] =>
  R.splice(array, 0, 0, [value]);

export const shift = <T>(array: T[]): T[] => R.splice(array, 0, 1, []);

export const replace = <T>(array: T[], index: number, value: T): T[] =>
  R.splice(array, index, 1, [value]);
