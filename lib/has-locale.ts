/** Local replacement for next-intl's hasLocale (keeps us compatible with 4.4.x). */
export function hasLocale(
  locales: readonly string[],
  locale: string | undefined | null,
): locale is string {
  return typeof locale === "string" && locales.includes(locale);
}
