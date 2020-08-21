export default function includesFields(
  query?: { [key: string]: string } | undefined
): boolean {
  let hasFields = false;
  /**
   * If Sparse fieldSets exist, we want to transform them before putting them in the cache
   *
   * Before:
   *
   * fields[cat]: 'lives,legs,ears'
   *
   * After:
   *
   * fields: {
   *  cat: 'lives,legs,ears'
   * }
   */
  if (query) {
    hasFields = Object.keys(query).find((key) => {
      return key.startsWith("fields");
    })
      ? true
      : false;
  }

  return hasFields;
}
