export const makePrefixArr = (prefix: string, min: number, max: number) =>
  Array.from({ length: max - min + 1 }, (_, i) => `${prefix}${min + i}`);
