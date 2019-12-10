import { makeDict } from './dict';

type Data<T> = Map<string, T>;
type OptimisticData<T> = { [optimisticKey: number]: Data<T | undefined> };

export interface KVMap<T> {
  optimistic: OptimisticData<T>;
  base: Data<T>;
  keys: number[];
}

export const make = <T>(): KVMap<T> => ({
  optimistic: makeDict(),
  base: new Map(),
  keys: [],
});

export const set = <T>(
  map: KVMap<T>,
  key: string,
  value: T | undefined,
  optimisticKey: null | number
): KVMap<T> => {
  if (optimisticKey) {
    if (map.optimistic[optimisticKey] === undefined) {
      map.optimistic[optimisticKey] = new Map();
      map.keys.unshift(optimisticKey);
    }

    map.optimistic[optimisticKey].set(key, value);
  } else if (value === undefined) {
    map.base.delete(key);
  } else {
    map.base.set(key, value);
  }

  return map;
};

export const clear = <T>(map: KVMap<T>, optimisticKey: number): KVMap<T> => {
  const index = map.keys.indexOf(optimisticKey);
  if (index > -1) {
    delete map.optimistic[optimisticKey];
    map.keys.splice(index, 1);
  }

  return map;
};

export const get = <T>(map: KVMap<T>, key: string): T | undefined => {
  for (let i = 0, l = map.keys.length; i < l; i++) {
    const optimistic = map.optimistic[map.keys[i]];
    if (optimistic.has(key)) return optimistic.get(key);
  }

  return map.base.get(key);
};
