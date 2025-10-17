/**
 * A better typed `Object.prototype.objectHasOwnOroperty`. It helps TypeScript
 * infer types when an object has multiple types with different properties.
 *
 * @example
 * type ColorType = string | GradientColorObject | PatternObject
 *
 * // color: ColorType | undefined
 * const color = pointOrSeries.color
 *
 * if (!color) {
 *   return FALLBACK_COLOR
 * }
 *
 * if (typeof color === 'string') {
 *   // color: string
 *   return color
 * }
 *
 * if (objectHasOwnProperty(color, 'pattern')) {
 *   // color: PatternObject
 *   return color.pattern.color ?? FALLBACK_COLOR
 * }
 *
 * // color: GradientColorObject
 * return getGradientColor(color)
 *
 *
 */
export function objectHasOwnProperty<Key extends PropertyKey>(
  object: object,
  key: Key,
): object is Record<Key, unknown> {
  return Object.prototype.hasOwnProperty.call(object, key);
}
