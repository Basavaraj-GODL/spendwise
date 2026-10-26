
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
  const months: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
  }

  const makeDate = (
    day: number,
    month: number,
    year: number
  ): string => {
    if (year < 100) year += 2000

    const date = new Date(year, month - 1, day)

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return ''
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Prefer dates near transaction-related labels when available.
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  const dateLines = [
    ...lines.filter(line => /\b(date|on|time|transaction date)\b/i.test(line)),
    ...lines,
  ]

  for (const line of dateLines) {
    // DD/MM/YYYY or DD-MM-YYYY (Indian format).
    const numeric = line.match(
      /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/
    )

    if (numeric) {
      const first = Number(numeric[1])
      const second = Number(numeric[2])
      const year = Number(numeric[3])

      // Use DD/MM when unambiguous; reject ambiguous dates instead
      // of silently choosing the wrong day and month.
      if (first > 12 && second <= 12) {
        const result = makeDate(first, second, year)
        if (result) return result
      } else if (second > 12 && first <= 12) {
        const result = makeDate(second, first, year)
        if (result) return result
      } else if (first <= 12 && second <= 12) {
        // Indian screenshots usually use DD/MM/YYYY.
        const result = makeDate(first, second, year)
        if (result) return result
      }
    }

    // Example: 24 Oct 2026 or 24 October 2026.
    const named = line.match(
      /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?,?\s+(\d{4})\b/i
    )

    if (named) {
      const month = months[named[2].toLowerCase()]
      const result = makeDate(Number(named[1]), month, Number(named[3]))
      if (result) return result
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


  // Detect amounts with currency symbols, labels, or common OCR variations.

  // Normalize common OCR mistakes without changing the original text.
  const amountText = normalizedText
    .replace(/[₹]/g, '₹')
    .replace(/\u20B9/g, '₹')

  const amountPatterns = [
    /₹\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /\b(?:rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /\b([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:rupees|inr|rs\.?)\b/i,
  ]

  let amount = ''

  for (const pattern of amountPatterns) {
    const match = amountText.match(pattern)

    if (match?.[1]) {
      const candidate = match[1].replace(/,/g, '')
      const numeric = Number(candidate)

      if (Number.isFinite(numeric) && numeric > 0) {
        amount = candidate
        break
      }
    }
  }

  // If no currency marker was recognized, inspect standalone amount
  // lines only when their context explicitly identifies them as amounts.
  if (!amount) {
    const lines = amountText.split(/\r?\n/).map(line => line.trim())

    for (let i = 0; i < lines.length; i++) {
      if (!/\b(amount|total|paid|sent|debited|credited)\b/i.test(lines[i])) {
        continue
      }

      const sameLine = lines[i].match(
        /\b(?:amount|total|paid|sent|debited|credited)\b\s*[:\-]?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i
      )

      const nextLine = lines[i + 1]?.match(
        /^\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*$/
      )

      const candidate = sameLine?.[1] ?? nextLine?.[1]

      if (candidate) {
        const numeric = Number(candidate.replace(/,/g, ''))

        if (Number.isFinite(numeric) && numeric > 0) {
          amount = candidate.replace(/,/g, '')
          break
        }
      }
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
      const firstScanText = result.data.text.trim()
      let text = firstScanText

      // Retry if the first scan did not detect a recognizable currency amount.
      const hasCurrencyAmount = (value: string) =>
        /₹\s*[0-9]|(?:rs\.?|inr)\s*[0-9]/i.test(value)

      if (!hasCurrencyAmount(firstScanText)) {
        const imageUrl = URL.createObjectURL(file)

        try {
          const image = new Image()
          image.src = imageUrl

          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('Could not load image'))
          })

          const canvas = document.createElement('canvas')
          const scale = Math.min(3, Math.max(2, 2200 / image.width))

          canvas.width = Math.round(image.width * scale)
          canvas.height = Math.round(image.height * scale)

          const context = canvas.getContext('2d')

          if (!context) throw new Error('Could not prepare the image')

          context.imageSmoothingEnabled = true
          context.imageSmoothingQuality = 'high'
          context.drawImage(image, 0, 0, canvas.width, canvas.height)

          const retry = await worker.recognize(canvas)
          const retryText = retry.data.text.trim()

          // Preserve both scans so the first result is not lost.
          if (retryText && retryText !== firstScanText) {
            text = `${firstScanText}\n${retryText}`
          }
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
// import { useState } from 'react'
// import { motion } from 'framer-motion'
// import {
//   ArrowLeft,
//   ScanLine,
//   Image as ImageIcon,
//   Loader2,
//   CheckCircle2,
//   AlertCircle,
// } from 'lucide-react'
// import { Link } from 'react-router-dom'
// import { createWorker } from 'tesseract.js'
// import { supabase } from '../supabase'

// const categories = [
//   'Food',
//   'Travel',
//   'Shopping',
//   'Education',
//   'Bills',
//   'Entertainment',
//   'Salary',
//   'Other',
// ]

// type TransactionType = 'income' | 'expense'

// function todayLocal() {
//   const date = new Date()
//   const year = date.getFullYear()
//   const month = String(date.getMonth() + 1).padStart(2, '0')
//   const day = String(date.getDate()).padStart(2, '0')
//   return `${year}-${month}-${day}`
// }

// function parseDate(text: string): string {
//   const months: Record<string, number> = {
//     jan: 1, january: 1,
//     feb: 2, february: 2,
//     mar: 3, march: 3,
//     apr: 4, april: 4,
//     may: 5,
//     jun: 6, june: 6,
//     jul: 7, july: 7,
//     aug: 8, august: 8,
//     sep: 9, sept: 9, september: 9,
//     oct: 10, october: 10,
//     nov: 11, november: 11,
//     dec: 12, december: 12,
//   }

//   const makeDate = (
//     day: number,
//     month: number,
//     year: number
//   ): string => {
//     if (year < 100) year += 2000

//     const date = new Date(year, month - 1, day)

//     if (
//       date.getFullYear() !== year ||
//       date.getMonth() !== month - 1 ||
//       date.getDate() !== day
//     ) {
//       return ''
//     }

//     return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
//   }

//   const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
//   const dateLines = [
//     ...lines.filter(line => /\b(date|on|time|transaction date)\b/i.test(line)),
//     ...lines,
//   ]

//   for (const line of dateLines) {
//     const numeric = line.match(
//       /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/
//     )

//     if (numeric) {
//       const first = Number(numeric[1])
//       const second = Number(numeric[2])
//       const year = Number(numeric[3])

//       if (first > 12 && second <= 12) {
//         const result = makeDate(first, second, year)
//         if (result) return result
//       } else if (second > 12 && first <= 12) {
//         const result = makeDate(second, first, year)
//         if (result) return result
//       } else if (first <= 12 && second <= 12) {
//         const result = makeDate(first, second, year)
//         if (result) return result
//       }
//     }

//     const named = line.match(
//       /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?,?\s+(\d{4})\b/i
//     )

//     if (named) {
//       const month = months[named[2].toLowerCase()]
//       const result = makeDate(Number(named[1]), month, Number(named[3]))
//       if (result) return result
//     }
//   }

//   return ''
// }

// function suggestCategory(text: string): string {
//   const value = text.toLowerCase()

//   if (/restaurant|food|swiggy|zomato|cafe|hotel|pizza|grocery|supermarket/.test(value)) return 'Food'
//   if (/uber|ola|rapido|metro|bus|train|flight|petrol|fuel/.test(value)) return 'Travel'
//   if (/salary|payroll|stipend/.test(value)) return 'Salary'
//   if (/college|school|tuition|course|exam|education/.test(value)) return 'Education'
//   if (/electricity|recharge|bill|broadband|water/.test(value)) return 'Bills'
//   if (/movie|cinema|game|netflix|spotify/.test(value)) return 'Entertainment'
//   if (/amazon|flipkart|shopping|store|mall/.test(value)) return 'Shopping'

//   return 'Other'
// }

// function parseAmount(text: string): string {
//   const normalized = text.replace(/\u00A0/g, ' ').replace(/[₹?]/g, '₹')
//   const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

//   // 1. Explicit currency symbol search (e.g. ₹100, ₹4,000, Rs 150)
//   const symbolRegex = /(?:₹|rs\.?|inr)\s*([0-9]{1,7}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i
//   for (const line of lines) {
//     const match = line.match(symbolRegex)
//     if (match && match[1]) {
//       const val = match[1].replace(/,/g, '')
//       if (Number(val) > 0) return val
//     }
//   }

//   // 2. Top-line standalone number scan (UPI apps place the main amount in the upper rows)
//   for (let i = 0; i < Math.min(lines.length, 12); i++) {
//     const line = lines[i]
//     const numMatch = line.match(/^([0-9]{1,7}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)$/)
//     if (numMatch && numMatch[1]) {
//       const val = numMatch[1].replace(/,/g, '')
//       const num = Number(val)
//       if (
//         num > 0 &&
//         num <= 10000000 &&
//         !/^[6-9]\d{9}$/.test(val) &&
//         !(val.length === 4 && num >= 2020 && num <= 2035)
//       ) {
//         return val
//       }
//     }
//   }

//   // 3. Fallback scan for any valid amount text
//   const generalRegex = /\b([0-9]{1,7}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\b/g
//   let bestCandidate = ''
//   for (const line of lines) {
//     if (/\b\d{10,}\b/.test(line) || /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(line)) continue
//     let match
//     while ((match = generalRegex.exec(line)) !== null) {
//       const val = match[1].replace(/,/g, '')
//       const num = Number(val)
//       if (num > 0 && num <= 10000000 && val.length < 8) {
//         bestCandidate = val
//       }
//     }
//   }
//   return bestCandidate
// }

// function parseTransaction(text: string) {
//   const normalizedText = text.replace(/\u00A0/g, ' ')
//   const lines = normalizedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

//   const amount = parseAmount(normalizedText)

//   const lower = normalizedText.toLowerCase()
//   const income =
//     /\b(received|credited|cashback received|money received|refund received)\b/.test(lower) &&
//     !/\b(payment received by|received by)\b/.test(lower)

//   const type: TransactionType = income ? 'income' : 'expense'

//   const ignored =
//     /^(paid successfully|payment successful|successful|success|completed|paid|sent|received|debited|credited|google pay|phonepe|gpay|upi|transaction details|payment details|view details|done|close|to|from|paid to|received from|payment to|payment from|amount|total|date|time|bank transfer)$/i

//   const isValidTitle = (value: string) => {
//     const candidate = value
//       .replace(/^(?:to|from|paid to|sent to|received from|payment to|payment from)\s*[:\-]?\s*/i, '')
//       .replace(/^[\s:–—-]+|[\s:–—-]+$/g, '')
//       .trim()

//     if (candidate.length < 2 || candidate.length > 70) return ''
//     if (ignored.test(candidate)) return ''
//     if (/^(?:₹|rs\.?|inr)\s*[\d,]+/i.test(candidate)) return ''
//     if (/^[\d\s,.:/-]+$/.test(candidate)) return ''
//     if (/\b(utr|upi ref|transaction id|reference number|order id)\b/i.test(candidate)) return ''
//     if (/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(candidate)) return ''
//     if (/^\d{6,}$/.test(candidate)) return ''

//     return candidate
//   }

//   let title = ''

//   for (let i = 0; i < lines.length; i++) {
//     const label = lines[i].match(
//       /^(?:paid to|sent to|received from|payment to|payment from|to|from)\s*[:\-]?\s*(.*)$/i
//     )

//     if (!label) continue

//     const sameLineTitle = isValidTitle(label[1])
//     if (sameLineTitle) {
//       title = sameLineTitle
//       break
//     }

//     for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
//       const nextTitle = isValidTitle(lines[j])
//       if (nextTitle) {
//         title = nextTitle
//         break
//       }
//     }

//     if (title) break
//   }

//   if (!title) {
//     title = lines.slice(1).map(isValidTitle).find(Boolean) || ''
//   }

//   return {
//     amount,
//     title,
//     date: parseDate(normalizedText),
//     type,
//     category: suggestCategory(`${title} ${normalizedText}`),
//   }
// }

// export default function AIScan() {
//   const [file, setFile] = useState<File | null>(null)
//   const [preview, setPreview] = useState('')
//   const [scanning, setScanning] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [progress, setProgress] = useState(0)
//   const [rawText, setRawText] = useState('')
//   const [error, setError] = useState('')
//   const [notice, setNotice] = useState('')
//   const [reviewReady, setReviewReady] = useState(false)

//   const [title, setTitle] = useState('')
//   const [amount, setAmount] = useState('')
//   const [date, setDate] = useState('')
//   const [type, setType] = useState<TransactionType>('expense')
//   const [category, setCategory] = useState('Other')
//   const [notes, setNotes] = useState('')

//   function chooseImage(selected?: File) {
//     if (!selected) return

//     if (!selected.type.startsWith('image/')) {
//       setError('Please choose an image screenshot.')
//       return
//     }

//     if (preview) URL.revokeObjectURL(preview)

//     setFile(selected)
//     setPreview(URL.createObjectURL(selected))
//     setRawText('')
//     setError('')
//     setNotice('')
//     setReviewReady(false)
//     setProgress(0)
//   }

//   async function scanImage() {
//     if (!file) return

//     setScanning(true)
//     setError('')
//     setNotice('')
//     setRawText('')
//     setReviewReady(false)

//     let worker: Awaited<ReturnType<typeof createWorker>> | undefined

//     try {
//       worker = await createWorker('eng', 1, {
//         logger: (message) => {
//           if (message.status === 'recognizing text') {
//             setProgress(Math.round((message.progress ?? 0) * 100))
//           }
//         },
//       })

//       const imageUrl = URL.createObjectURL(file)
//       let combinedText = ''

//       try {
//         const image = new Image()
//         image.src = imageUrl

//         await new Promise<void>((resolve, reject) => {
//           image.onload = () => resolve()
//           image.onerror = () => reject(new Error('Could not load image'))
//         })

//         const processCanvas = async (adjust?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
//           const canvas = document.createElement('canvas')
//           const scale = Math.min(3, Math.max(2, 2400 / image.width))
//           canvas.width = Math.round(image.width * scale)
//           canvas.height = Math.round(image.height * scale)
//           const context = canvas.getContext('2d')
//           if (!context) return ''

//           context.imageSmoothingEnabled = true
//           context.imageSmoothingQuality = 'high'
//           context.drawImage(image, 0, 0, canvas.width, canvas.height)

//           if (adjust) {
//             adjust(context, canvas.width, canvas.height)
//           }

//           const res = await worker!.recognize(canvas)
//           return res.data.text.trim()
//         }

//         // Pass 1: Standard high-res scan
//         const text1 = await processCanvas()
//         combinedText += '\n' + text1

//         // Pass 2: Grayscale & High Contrast
//         const text2 = await processCanvas((ctx, w, h) => {
//           const imgData = ctx.getImageData(0, 0, w, h)
//           const data = imgData.data
//           for (let i = 0; i < data.length; i += 4) {
//             let avg = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11)
//             avg = avg < 130 ? avg * 0.6 : Math.min(255, avg * 1.4)
//             data[i] = avg
//             data[i + 1] = avg
//             data[i + 2] = avg
//           }
//           ctx.putImageData(imgData, 0, 0)
//         })
//         combinedText += '\n' + text2

//         // Pass 3: Color Inversion (for PhonePe / Paytm dark screens)
//         const text3 = await processCanvas((ctx, w, h) => {
//           const imgData = ctx.getImageData(0, 0, w, h)
//           const data = imgData.data
//           for (let i = 0; i < data.length; i += 4) {
//             data[i] = 255 - data[i]
//             data[i + 1] = 255 - data[i + 1]
//             data[i + 2] = 255 - data[i + 2]
//           }
//           ctx.putImageData(imgData, 0, 0)
//         })
//         combinedText += '\n' + text3

//       } finally {
//         URL.revokeObjectURL(imageUrl)
//       }

//       setRawText(combinedText.trim())

//       if (!combinedText.trim()) {
//         setError('No readable text found. Try a clearer screenshot.')
//         return
//       }

//       const parsed = parseTransaction(combinedText)

//       setAmount(parsed.amount)
//       setTitle(parsed.title)
//       setDate(parsed.date)
//       setType(parsed.type)
//       setCategory(parsed.category)
//       setNotes('')
//       setReviewReady(true)

//       setNotice(
//         'Review the suggested details below. Anything not detected correctly must be corrected before saving.'
//       )
//     } catch {
//       setError('Scanning failed. Check your internet connection and try again.')
//     } finally {
//       if (worker) await worker.terminate()
//       setScanning(false)
//     }
//   }

//   async function saveTransaction() {
//     setError('')
//     setNotice('')

//     const numericAmount = Number(amount)

//     if (!title.trim()) {
//       setError('Enter the merchant or person name.')
//       return
//     }

//     if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
//       setError('Enter a valid amount greater than zero.')
//       return
//     }

//     if (!date) {
//       setError('Please confirm the transaction date.')
//       return
//     }

//     if (date > todayLocal()) {
//       setError('The transaction date cannot be in the future.')
//       return
//     }

//     const amountPaise = Math.round(numericAmount * 100)

//     if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
//       setError('Enter a valid amount with up to two decimal places.')
//       return
//     }

//     setSaving(true)

//     try {
//       const { data: { user }, error: userError } = await supabase.auth.getUser()

//       if (userError || !user) {
//         setError('Please log in to SpendWise before saving a transaction.')
//         return
//       }

//       const { data: existing, error: duplicateError } = await supabase
//         .from('transactions')
//         .select('id')
//         .eq('user_id', user.id)
//         .eq('title', title.trim())
//         .eq('amount_paise', amountPaise)
//         .eq('transaction_date', date)
//         .eq('type', type)
//         .limit(1)

//       if (duplicateError) throw duplicateError

//       if (existing && existing.length > 0) {
//         setError(
//           'A matching transaction already exists. Check your Transactions page before adding it again.'
//         )
//         return
//       }

//       const { error: insertError } = await supabase
//         .from('transactions')
//         .insert({
//           user_id: user.id,
//           title: title.trim(),
//           amount_paise: amountPaise,
//           type,
//           category,
//           transaction_date: date,
//           notes: notes.trim() || null,
//         })

//       if (insertError) throw insertError

//       setNotice('Transaction saved successfully!')
//       setReviewReady(false)
//       setRawText('')
//       setFile(null)

//       if (preview) URL.revokeObjectURL(preview)
//       setPreview('')
//       setTitle('')
//       setAmount('')
//       setDate('')
//       setType('expense')
//       setCategory('Other')
//       setNotes('')
//     } catch (err) {
//       setError(
//         err instanceof Error
//           ? err.message
//           : 'Could not save the transaction. Please try again.'
//       )
//     } finally {
//       setSaving(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-base px-4 py-8 text-ink sm:px-8">
//       <div className="mx-auto max-w-3xl">
//         <Link
//           to="/app/transactions"
//           className="mb-8 inline-flex items-center gap-2 text-sm text-mute transition hover:text-ink"
//         >
//           <ArrowLeft size={16} /> Back to transactions
//         </Link>

//         <motion.div
//           initial={{ opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mb-8"
//         >
//           <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400">
//             <ScanLine size={25} />
//           </div>
//           <p className="text-sm font-semibold text-cyan-400">
//             SPENDWISE INTELLIGENCE
//           </p>
//           <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
//             AI <span className="grad-text">Transaction Scan</span>
//           </h1>
//           <p className="mt-3 max-w-xl text-sm leading-6 text-mute">
//             Upload an individual payment screenshot. SpendWise will suggest
//             transaction details for you to review before saving.
//           </p>
//         </motion.div>

//         <div className="glass rounded-3xl p-5 sm:p-8">
//           <label
//             htmlFor="transaction-image"
//             className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-line/15 px-5 py-8 text-center transition hover:border-violet-400/60"
//           >
//             {preview ? (
//               <img
//                 src={preview}
//                 alt="Selected payment screenshot"
//                 className="max-h-80 max-w-full rounded-xl object-contain"
//               />
//             ) : (
//               <>
//                 <ImageIcon size={42} className="mb-4 text-violet-400" />
//                 <span className="font-semibold">Choose payment screenshot</span>
//                 <span className="mt-2 text-sm text-mute">
//                   Select an image from your device
//                 </span>
//               </>
//             )}
//           </label>

//           <input
//             id="transaction-image"
//             type="file"
//             accept="image/*"
//             className="sr-only"
//             onChange={(event) => chooseImage(event.target.files?.[0])}
//           />

//           {file && (
//             <p className="mt-3 break-all text-xs text-mute">{file.name}</p>
//           )}

//           <button
//             type="button"
//             onClick={scanImage}
//             disabled={!file || scanning}
//             className="btn btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {scanning ? (
//               <>
//                 <Loader2 size={18} className="animate-spin" />
//                 Reading screenshot… {progress}%
//               </>
//             ) : (
//               <>
//                 <ScanLine size={18} />
//                 Scan and identify details
//               </>
//             )}
//           </button>

//           {scanning && (
//             <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
//               <div
//                 className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
//                 style={{ width: `${progress}%` }}
//               />
//             </div>
//           )}

//           {error && (
//             <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-400">
//               <AlertCircle size={18} className="mt-0.5 shrink-0" />
//               {error}
//             </p>
//           )}

//           {notice && (
//             <p role="status" className="mt-4 flex items-start gap-2 text-sm text-cyan-400">
//               <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
//               {notice}
//             </p>
//           )}

//           {reviewReady && (
//             <div className="mt-7 border-t border-line/10 pt-6">
//               <h2 className="text-xl font-bold">Review transaction</h2>
//               <p className="mt-2 text-sm leading-6 text-mute">
//                 These are suggestions, not verified payment details. Correct
//                 any mistakes before saving.
//               </p>

//               <div className="mt-5 grid gap-4 sm:grid-cols-2">
//                 <label className="text-sm">
//                   Merchant or person
//                   <input
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                     placeholder="e.g. Grocery store"
//                     required
//                     className="mt-2 w-full rounded-xl border border-line/10 bg-black/10 px-3 py-3 text-ink outline-none focus:border-cyan-400"
//                   />
//                 </label>

//                 <label className="text-sm">
//                   Amount (₹)
//                   <input
//                     type="number"
//                     min="0.01"
//                     step="0.01"
//                     value={amount}
//                     onChange={(e) => setAmount(e.target.value)}
//                     placeholder="0.00"
//                     required
//                     className="mt-2 w-full rounded-xl border border-line/10 bg-black/10 px-3 py-3 text-ink outline-none focus:border-cyan-400"
//                   />
//                 </label>

//                 <label className="text-sm">
//                   Transaction date
//                   <input
//                     type="date"
//                     max={todayLocal()}
//                     value={date}
//                     onChange={(e) => setDate(e.target.value)}
//                     required
//                     className="mt-2 w-full rounded-xl border border-line/10 bg-black/10 px-3 py-3 text-ink outline-none focus:border-cyan-400"
//                   />
//                 </label>

//                 <label className="text-sm">
//                   Type
//                   <select
//                     value={type}
//                     onChange={(e) => setType(e.target.value as TransactionType)}
//                     className="mt-2 w-full rounded-xl border border-line/10 bg-base px-3 py-3 text-ink outline-none focus:border-cyan-400"
//                   >
//                     <option value="expense">Expense — money paid</option>
//                     <option value="income">Income — money received</option>
//                   </select>
//                 </label>

//                 <label className="text-sm sm:col-span-2">
//                   Category
//                   <select
//                     value={category}
//                     onChange={(e) => setCategory(e.target.value)}
//                     className="mt-2 w-full rounded-xl border border-line/10 bg-base px-3 py-3 text-ink outline-none focus:border-cyan-400"
//                   >
//                     {categories.map((item) => (
//                       <option key={item} value={item}>
//                         {item}
//                       </option>
//                     ))}
//                   </select>
//                 </label>

//                 <label className="text-sm sm:col-span-2">
//                   Notes (optional)
//                   <textarea
//                     value={notes}
//                     onChange={(e) => setNotes(e.target.value)}
//                     rows={2}
//                     placeholder="Add a note if needed"
//                     className="mt-2 w-full rounded-xl border border-line/10 bg-black/10 px-3 py-3 text-ink outline-none focus:border-cyan-400"
//                   />
//                 </label>
//               </div>

//               <button
//                 type="button"
//                 onClick={saveTransaction}
//                 disabled={saving}
//                 className="btn btn-primary mt-6 w-full disabled:opacity-50"
//               >
//                 {saving ? (
//                   <>
//                     <Loader2 size={18} className="animate-spin" />
//                     Saving…
//                   </>
//                 ) : (
//                   <>
//                     <CheckCircle2 size={18} />
//                     Confirm and save transaction
//                   </>
//                 )}
//               </button>
//             </div>
//           )}

//           {rawText && (
//             <details className="mt-6 border-t border-line/10 pt-5">
//               <summary className="cursor-pointer text-sm font-semibold text-mute">
//                 View original extracted text
//               </summary>
//               <textarea
//                 readOnly
//                 value={rawText}
//                 rows={8}
//                 className="mt-3 w-full rounded-xl border border-line/10 bg-black/10 p-3 text-sm text-ink"
//               />
//             </details>
//           )}
//         </div>

//         <p className="mt-5 text-xs leading-5 text-mute">
//           The screenshot is processed using browser OCR. Review all suggested
//           details carefully. Only confirmed transaction fields are sent to
//           your SpendWise database.
//         </p>
//       </div>
//     </div>
//   )
// }