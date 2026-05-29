/**
 * Returns true if the provided environment variable represents a truthy value.
 *
 * Truthy values: `true`, `t`, `yes`, `y`, `on`, `1`
 */
const TRUTHY_ENV_PATTERN = /^(?:1|true|t|yes|y|on)$/i

export function isEnvTruthy(value: string | undefined | null): boolean {
  if (value == null)
    return false
  return TRUTHY_ENV_PATTERN.test(value.trim())
}
