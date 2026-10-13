import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// A short-lived browser update token, unrelated to the private hub credential.
const secret = randomBytes(32)
const sign = (expires: string) =>
  createHmac('sha256', secret).update(expires).digest('hex')

export function createUpdateToken() {
  const expires = String(Date.now() + 60_000)
  return `${expires}.${sign(expires)}`
}

export function verifyUpdateToken(token: string | null) {
  if (!token) return false
  const [expires, signature, extra] = token.split('.')
  if (
    !expires ||
    !signature ||
    extra ||
    !/^\d+$/.test(expires) ||
    Number(expires) <= Date.now()
  )
    return false
  const expected = Buffer.from(sign(expires))
  const actual = Buffer.from(signature)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
