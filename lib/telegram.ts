import crypto from 'crypto'

export interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

const MAX_AUTH_AGE_SECONDS = 300 // 5 minutes

export function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...rest } = data

  // Check auth_date freshness
  const now = Math.floor(Date.now() / 1000)
  if (now - data.auth_date > MAX_AUTH_AGE_SECONDS) return false

  // Per Telegram docs: SHA256(bot_token) as secret key, HMAC-SHA256 of sorted key=value pairs
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .filter((entry) => !entry.endsWith('=undefined'))
    .join('\n')

  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')
  return hmac === hash
}

export function deriveTelegramPassword(telegramId: number, secret: string): string {
  return crypto.createHmac('sha256', secret).update(String(telegramId)).digest('hex')
}
