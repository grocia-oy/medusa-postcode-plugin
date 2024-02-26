export const sliceArrayInChunks = (array: any[], size) => {
  const result = [];

  while (array.length > 0) {
    result.push(array.splice(0, size));
  }

  return result;
};
