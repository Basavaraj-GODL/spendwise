
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ScanLine,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { createWorker } from 'tesseract.js'
import { supabase } from '../supabase'

const categories = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Bills',
  'Entertainment',
  'Salary',
  'Other',
]

type TransactionType = 'income' | 'expense'

function todayLocal() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(text: string): string {
  const numeric = text.match(
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/
  )

  if (numeric) {
    let [, first, second, year] = numeric
    const a = Number(first)
    const b = Number(second)
    let y = Number(year)

    if (y < 100) y += 2000

    // Prefer Indian date format: DD/MM/YYYY.
    let day = a
    let month = b

    // If the first number cannot be a month, the format is unambiguous.
    if (a > 12 && b <= 12) {
      day = a
      month = b
    }

    const date = new Date(y, month - 1, day)
    if (
      date.getFullYear() === y &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  const months: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  }

  const named = text.match(
    /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*,?\s*(\d{4})?\b/i
  )

  if (named) {
    const day = Number(named[1])
    const month = months[named[2].toLowerCase()]
    const year = Number(named[3] || new Date().getFullYear())

    if (day >= 1 && day <= 31) {
      return `${year}-${month}-${String(day).padStart(2, '0')}`
    }
  }

  return ''
}

function suggestCategory(text: string): string {
  const value = text.toLowerCase()

  if (/restaurant|food|swiggy|zomato|cafe|hotel|pizza|grocery|supermarket/.test(value)) return 'Food'
  if (/uber|ola|rapido|metro|bus|train|flight|petrol|fuel/.test(value)) return 'Travel'
  if (/salary|payroll|stipend/.test(value)) return 'Salary'
  if (/college|school|tuition|course|exam|education/.test(value)) return 'Education'
  if (/electricity|recharge|bill|broadband|water/.test(value)) return 'Bills'
  if (/movie|cinema|game|netflix|spotify/.test(value)) return 'Entertainment'
  if (/amazon|flipkart|shopping|store|mall/.test(value)) return 'Shopping'

  return 'Other'
}


function parseTransaction(text: string) {
  const normalizedText = text
    .replace(/\u00A0/g, ' ')
    .replace(/[₹]/g, '₹')

  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  // Detect amounts written with a currency symbol or label.
  const amountPatterns = [
    /₹\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /\b(?:rs\.?|inr)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
    /\b([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:rupees|inr|rs\.?)\b/i,
  ]

  let amount = ''

  for (const pattern of amountPatterns) {
    const match = normalizedText.match(pattern)
    if (match?.[1]) {
      amount = match[1].replace(/,/g, '')
      break
    }
  }

  const lower = normalizedText.toLowerCase()

  const income =
    /\b(received|credited|cashback received|money received|refund received)\b/.test(lower) &&
    !/\b(payment received by|received by)\b/.test(lower)

  const type: TransactionType = income ? 'income' : 'expense'

  const ignored =
    /^(paid successfully|payment successful|successful|success|completed|paid|sent|received|debited|credited|google pay|phonepe|gpay|upi|transaction details|payment details|view details|done|close|to|from|paid to|received from|payment to|payment from|amount|total|date|time|bank transfer)$/i

  const isValidTitle = (value: string) => {
    const candidate = value
      .replace(/^(?:to|from|paid to|sent to|received from|payment to|payment from)\s*[:\-]?\s*/i, '')
      .replace(/^[\s:–—-]+|[\s:–—-]+$/g, '')
      .trim()

    if (candidate.length < 2 || candidate.length > 70) return ''
    if (ignored.test(candidate)) return ''
    if (/^(?:₹|rs\.?|inr)\s*[\d,]+/i.test(candidate)) return ''
    if (/^[\d\s,.:/-]+$/.test(candidate)) return ''
    if (/\b(utr|upi ref|transaction id|reference number|order id)\b/i.test(candidate)) return ''
    if (/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(candidate)) return ''
    if (/^\d{6,}$/.test(candidate)) return ''

    return candidate
  }

  let title = ''

  for (let i = 0; i < lines.length; i++) {
    const label = lines[i].match(
      /^(?:paid to|sent to|received from|payment to|payment from|to|from)\s*[:\-]?\s*(.*)$/i
    )

    if (!label) continue

    const sameLineTitle = isValidTitle(label[1])
    if (sameLineTitle) {
      title = sameLineTitle
      break
    }

    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const nextTitle = isValidTitle(lines[j])
      if (nextTitle) {
        title = nextTitle
        break
      }
    }

    if (title) break
  }

  if (!title) {
    title = lines.slice(1).map(isValidTitle).find(Boolean) || ''
  }

  return {
    amount,
    title,
    date: parseDate(normalizedText),
    type,
    category: suggestCategory(`${title} ${normalizedText}`),
  }
}


export default function AIScan() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [scanning, setScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [rawText, setRawText] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reviewReady, setReviewReady] = useState(false)

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [category, setCategory] = useState('Other')
  const [notes, setNotes] = useState('')

  function chooseImage(selected?: File) {
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      setError('Please choose an image screenshot.')
      return
    }

    if (preview) URL.revokeObjectURL(preview)

    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setRawText('')
    setError('')
    setNotice('')
    setReviewReady(false)
    setProgress(0)
  }

  async function scanImage() {
    if (!file) return

    setScanning(true)
    setError('')
    setNotice('')
    setRawText('')
    setReviewReady(false)

    let worker: Awaited<ReturnType<typeof createWorker>> | undefined

    try {
      worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (message.status === 'recognizing text') {
            setProgress(Math.round((message.progress ?? 0) * 100))
          }
        },
      })

     const result = await worker.recognize(file)
let text = result.data.text.trim()

// If the first scan misses the amount, retry with a clearer image.
const hasAmount = /₹\s*\d|(?:rs\.?|inr)\s*\d/i.test(text)

if (!hasAmount) {
  const image = new Image()
  const imageUrl = URL.createObjectURL(file)

  try {
    text = await new Promise<string>((resolve, reject) => {
      image.onload = async () => {
        try {
          const canvas = document.createElement('canvas')
          const scale = Math.max(2, 1600 / image.width)

          canvas.width = Math.round(image.width * scale)
          canvas.height = Math.round(image.height * scale)

          const context = canvas.getContext('2d')
          if (!context) {
            reject(new Error('Could not prepare the image'))
            return
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height)

          const retry = await worker!.recognize(canvas)
          resolve(retry.data.text.trim())
        } catch (error) {
          reject(error)
        }
      }

      image.onerror = () => reject(new Error('Could not load image'))
      image.src = imageUrl
    })
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

setRawText(text)

      if (!text) {
        setError('No readable text found. Try a clearer screenshot.')
        return
      }

      const parsed = parseTransaction(text)

      setAmount(parsed.amount)
      setTitle(parsed.title)
      setDate(parsed.date)
      setType(parsed.type)
      setCategory(parsed.category)
      setNotes('')
      setReviewReady(true)

      setNotice(
        'Review the suggested details below. Anything not detected correctly must be corrected before saving.'
      )
    } catch {
      setError('Scanning failed. Check your internet connection and try again.')
    } finally {
      if (worker) await worker.terminate()
      setScanning(false)
    }
  }

  async function saveTransaction() {
    setError('')
    setNotice('')

    const numericAmount = Number(amount)

    if (!title.trim()) {
      setError('Enter the merchant or person name.')
      return
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount greater than zero.')
      return
    }

    if (!date) {
      setError('Please confirm the transaction date.')
      return
    }

    if (date > todayLocal()) {
      setError('The transaction date cannot be in the future.')
      return
    }

    const amountPaise = Math.round(numericAmount * 100)

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      setError('Enter a valid amount with up to two decimal places.')
      return
    }

    setSaving(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('Please log in to SpendWise before saving a transaction.')
        return
      }

      // Prevent an obvious duplicate belonging to this user.
      const { data: existing, error: duplicateError } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', title.trim())
        .eq('amount_paise', amountPaise)
        .eq('transaction_date', date)
        .eq('type', type)
        .limit(1)

      if (duplicateError) throw duplicateError

      if (existing && existing.length > 0) {
        setError(
          'A matching transaction already exists. Check your Transactions page before adding it again.'
        )
        return
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          title: title.trim(),
          amount_paise: amountPaise,
          type,
          category,
          transaction_date: date,
          notes: notes.trim() || null,
        })

      if (insertError) throw insertError

      setNotice('Transaction saved successfully!')
      setReviewReady(false)
      setRawText('')
      setFile(null)

      if (preview) URL.revokeObjectURL(preview)
      setPreview('')
      setTitle('')
      setAmount('')
      setDate('')
      setType('expense')
      setCategory('Other')
      setNotes('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save the transaction. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-base px-4 py-8 text-ink sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/app/transactions"
          className="mb-8 inline-flex items-center gap-2 text-sm text-mute transition hover:text-ink"
        >
          <ArrowLeft size={16} /> Back to transactions
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400">
            <ScanLine size={25} />
          </div>
          <p className="text-sm font-semibold text-cyan-400">
            SPENDWISE INTELLIGENCE
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            AI <span className="grad-text">Transaction Scan</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-mute">
            Upload an individual payment screenshot. SpendWise will suggest
            transaction details for you to review before saving.
          </p>
        </motion.div>

        <div className="glass rounded-3xl p-5 sm:p-8">
          <label
            htmlFor="transaction-image"
            className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-line/15 px-5 py-8 text-center transition hover:border-violet-400/60"
          >
            {preview ? (
              <img
                src={preview}
                alt="Selected payment screenshot"
                className="max-h-80 max-w-full rounded-xl object-contain"
              />
            ) : (
              <>
                <ImageIcon size={42} className="mb-4 text-violet-400" />
                <span className="font-semibold">Choose payment screenshot</span>
                <span className="mt-2 text-sm text-mute">
                  Select an image from your device
                </span>
              </>
            )}
          </label>

          <input
            id="transaction-image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => chooseImage(event.target.files?.[0])}
          />

          {file && (
            <p className="mt-3 break-all text-xs text-mute">{file.name}</p>
          )}

          <button
            type="button"
            onClick={scanImage}
            disabled={!file || scanning}
            className="btn btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scanning ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Reading screenshot… {progress}%
              </>
            ) : (
              <>
                <ScanLine size={18} />
                Scan and identify details
              </>
            )}
          </button>

          {scanning && (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-400">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          {notice && (
            <p role="status" className="mt-4 flex items-start gap-2 text-sm text-cyan-400">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              {notice}
            </p>
          )}

          {reviewReady && (
            <div className="mt-7 border-t border-line/10 pt-6">
              <h2 className="text-xl font-bold">Review transaction</h2>
              <p className="mt-2 text-sm leading-6 text-mute">
                These are suggestions, not verified payment details. Correct
                any mistakes before saving.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  Merchant or person
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Grocery store"
                    required
                    className="mt-2 w-full rounded-xl border border-line/10 bg-black/10 px-3 py-3 text-ink outline-none focus:border-cyan-400"
                  />
                </label>

                <label className="text-sm">
                  Amount (₹)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="mt-2 w-full rounded-xl border border-line/10 bg-black/10 px-3 py-3 text-ink outline-none focus:border-cyan-400"
                  />
                </label>

                <label className="text-sm">
                  Transaction date
                  <input
                    type="date"
                    max={todayLocal()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-line/10 bg-black/10 px-3 py-3 text-ink outline-none focus:border-cyan-400"
                  />
                </label>

                <label className="text-sm">
                  Type
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="mt-2 w-full rounded-xl border border-line/10 bg-base px-3 py-3 text-ink outline-none focus:border-cyan-400"
                  >
                    <option value="expense">Expense — money paid</option>
                    <option value="income">Income — money received</option>
                  </select>
                </label>

                <label className="text-sm sm:col-span-2">
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-line/10 bg-base px-3 py-3 text-ink outline-none focus:border-cyan-400"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm sm:col-span-2">
                  Notes (optional)
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Add a note if needed"
                    className="mt-2 w-full rounded-xl border border-line/10 bg-black/10 px-3 py-3 text-ink outline-none focus:border-cyan-400"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={saveTransaction}
                disabled={saving}
                className="btn btn-primary mt-6 w-full disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Confirm and save transaction
                  </>
                )}
              </button>
            </div>
          )}

          {rawText && (
            <details className="mt-6 border-t border-line/10 pt-5">
              <summary className="cursor-pointer text-sm font-semibold text-mute">
                View original extracted text
              </summary>
              <textarea
                readOnly
                value={rawText}
                rows={8}
                className="mt-3 w-full rounded-xl border border-line/10 bg-black/10 p-3 text-sm text-ink"
              />
            </details>
          )}
        </div>

        <p className="mt-5 text-xs leading-5 text-mute">
          The screenshot is processed using browser OCR. Review all suggested
          details carefully. Only confirmed transaction fields are sent to
          your SpendWise database.
        </p>
      </div>
    </div>
  )
}
