import { Textbee } from '@textbee/sdk'



const OTP_KEY = 'pending_otp'
const SIGNUP_KEY = 'pending_signup'
const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes

export interface PendingSignup {
  name: string
  email: string
  password: string
  phone: string // already normalised, e.g. +919876543210
}

// Accepts "9876543210", "+919876543210", "91 98765 43210" -> "+919876543210"
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return null
}

function generateOtp(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 1000000).padStart(6, '0')
}

export async function sendOtp(phone: string) {
  if (!import.meta.env.VITE_TEXTBEE_API_KEY) {
    throw new Error('VITE_TEXTBEE_API_KEY is missing in .env (restart the dev server).')
  }
  if (!import.meta.env.VITE_TEXTBEE_DEVICE_ID) {
    throw new Error('VITE_TEXTBEE_DEVICE_ID is missing in .env (restart the dev server).')
  }

  const otp = generateOtp()

  const textbee = new Textbee({
    apiKey: import.meta.env.VITE_TEXTBEE_API_KEY,
  })

  const result = await textbee.sendSms({
    deviceId: import.meta.env.VITE_TEXTBEE_DEVICE_ID,
    recipients: [phone],
    message: `Your SpendWise OTP is: ${otp}. It expires in 5 minutes.`,
  })
  console.log('TextBee response:', result)

  // Only stored after the SMS call succeeded
  sessionStorage.setItem(
    OTP_KEY,
    JSON.stringify({ otp, phone, expiresAt: Date.now() + OTP_TTL_MS })
  )
}

export function verifyOtp(entered: string): { ok: boolean; error?: string } {
  const raw = sessionStorage.getItem(OTP_KEY)
  if (!raw) return { ok: false, error: 'No OTP found. Please request a new one.' }

  const { otp, expiresAt } = JSON.parse(raw)
  if (Date.now() > expiresAt) {
    sessionStorage.removeItem(OTP_KEY)
    return { ok: false, error: 'OTP expired. Please request a new one.' }
  }
  if (entered !== otp) return { ok: false, error: 'Incorrect OTP.' }

  sessionStorage.removeItem(OTP_KEY)
  return { ok: true }
}

// ---- signup details held until the OTP is verified ----

export function savePendingSignup(data: PendingSignup) {
  sessionStorage.setItem(SIGNUP_KEY, JSON.stringify(data))
}

export function getPendingSignup(): PendingSignup | null {
  const raw = sessionStorage.getItem(SIGNUP_KEY)
  return raw ? (JSON.parse(raw) as PendingSignup) : null
}

export function clearPendingSignup() {
  sessionStorage.removeItem(SIGNUP_KEY)
  sessionStorage.removeItem(OTP_KEY)
}