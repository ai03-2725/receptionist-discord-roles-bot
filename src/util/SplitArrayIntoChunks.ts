export function splitArrayIntoChunks<T>(array: T[], itemsPerChunk: number) {

  return Array.from(
    // Set length to what the resulting array length would be
    {length: Math.ceil(array.length / itemsPerChunk)}, 
    // Then per each target element iter, slice the original array
    (element, index) => array.slice(index * itemsPerChunk, index * itemsPerChunk + itemsPerChunk)
  )
}