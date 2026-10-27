
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

//   // Prefer dates near transaction-related labels when available.
//   const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
//   const dateLines = [
//     ...lines.filter(line => /\b(date|on|time|transaction date)\b/i.test(line)),
//     ...lines,
//   ]

//   for (const line of dateLines) {
//     // DD/MM/YYYY or DD-MM-YYYY (Indian format).
//     const numeric = line.match(
//       /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/
//     )

//     if (numeric) {
//       const first = Number(numeric[1])
//       const second = Number(numeric[2])
//       const year = Number(numeric[3])

//       // Use DD/MM when unambiguous; reject ambiguous dates instead
//       // of silently choosing the wrong day and month.
//       if (first > 12 && second <= 12) {
//         const result = makeDate(first, second, year)
//         if (result) return result
//       } else if (second > 12 && first <= 12) {
//         const result = makeDate(second, first, year)
//         if (result) return result
//       } else if (first <= 12 && second <= 12) {
//         // Indian screenshots usually use DD/MM/YYYY.
//         const result = makeDate(first, second, year)
//         if (result) return result
//       }
//     }

//     // Example: 24 Oct 2026 or 24 October 2026.
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


// function parseTransaction(text: string) {
//   const normalizedText = text
//     .replace(/\u00A0/g, ' ')
//     .replace(/[₹]/g, '₹')

//   const lines = normalizedText
//     .split(/\r?\n/)
//     .map((line) => line.trim())
//     .filter(Boolean)


//   // Detect amounts with currency symbols, labels, or common OCR variations.

//   // Normalize common OCR mistakes without changing the original text.
//   const amountText = normalizedText
//     .replace(/[₹]/g, '₹')
//     .replace(/\u20B9/g, '₹')

//   const amountPatterns = [
//     /₹\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
//     /\b(?:rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
//     /\b([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:rupees|inr|rs\.?)\b/i,
//   ]

//   let amount = ''

//   for (const pattern of amountPatterns) {
//     const match = amountText.match(pattern)

//     if (match?.[1]) {
//       const candidate = match[1].replace(/,/g, '')
//       const numeric = Number(candidate)

//       if (Number.isFinite(numeric) && numeric > 0) {
//         amount = candidate
//         break
//       }
//     }
//   }

//   // If no currency marker was recognized, inspect standalone amount
//   // lines only when their context explicitly identifies them as amounts.
//   if (!amount) {
//     const lines = amountText.split(/\r?\n/).map(line => line.trim())

//     for (let i = 0; i < lines.length; i++) {
//       if (!/\b(amount|total|paid|sent|debited|credited)\b/i.test(lines[i])) {
//         continue
//       }

//       const sameLine = lines[i].match(
//         /\b(?:amount|total|paid|sent|debited|credited)\b\s*[:\-]?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i
//       )

//       const nextLine = lines[i + 1]?.match(
//         /^\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*$/
//       )

//       const candidate = sameLine?.[1] ?? nextLine?.[1]

//       if (candidate) {
//         const numeric = Number(candidate.replace(/,/g, ''))

//         if (Number.isFinite(numeric) && numeric > 0) {
//           amount = candidate.replace(/,/g, '')
//           break
//         }
//       }
//     }
//   }

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


//       const result = await worker.recognize(file)
//       const firstScanText = result.data.text.trim()
//       let text = firstScanText

//       // Retry if the first scan did not detect a recognizable currency amount.
//       const hasCurrencyAmount = (value: string) =>
//         /₹\s*[0-9]|(?:rs\.?|inr)\s*[0-9]/i.test(value)

//       if (!hasCurrencyAmount(firstScanText)) {
//         const imageUrl = URL.createObjectURL(file)

//         try {
//           const image = new Image()
//           image.src = imageUrl

//           await new Promise<void>((resolve, reject) => {
//             image.onload = () => resolve()
//             image.onerror = () => reject(new Error('Could not load image'))
//           })

//           const canvas = document.createElement('canvas')
//           const scale = Math.min(3, Math.max(2, 2200 / image.width))

//           canvas.width = Math.round(image.width * scale)
//           canvas.height = Math.round(image.height * scale)

//           const context = canvas.getContext('2d')

//           if (!context) throw new Error('Could not prepare the image')

//           context.imageSmoothingEnabled = true
//           context.imageSmoothingQuality = 'high'
//           context.drawImage(image, 0, 0, canvas.width, canvas.height)

//           const retry = await worker.recognize(canvas)
//           const retryText = retry.data.text.trim()

//           // Preserve both scans so the first result is not lost.
//           if (retryText && retryText !== firstScanText) {
//             text = `${firstScanText}\n${retryText}`
//           }
//         } finally {
//           URL.revokeObjectURL(imageUrl)
//         }
//       }


//       setRawText(text)

//       if (!text) {
//         setError('No readable text found. Try a clearer screenshot.')
//         return
//       }

//       const parsed = parseTransaction(text)

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

//       // Prevent an obvious duplicate belonging to this user.
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
import { createWorker, PSM } from 'tesseract.js'
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

type ParsedTransaction = {
  amount: string
  amountOptions: string[]
  title: string
  date: string
  type: TransactionType
  category: string
}

// =====================================================================
// PARSER START  (pure functions: no React, easy to test)
// =====================================================================

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function todayLocal() {
  const date = new Date()
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/* ------------------------------ DATES ------------------------------ */

const MONTH_NAMES =
  'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'

const MONTH_INDEX: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

// Returns YYYY-MM-DD for a real calendar date, otherwise ''.
function toIsoDate(year: number, month: number, day: number): string {
  if (year < 2000 || year > new Date().getFullYear() + 1) return ''
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return ''
  }
  return `${year}-${pad2(month)}-${pad2(day)}`
}

// OCR often turns "Oct" into "0ct", "Sep" into "5ep", "2026" into "2O26".
function fixOcrDateText(text: string): string {
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/\b0ct\b/gi, 'Oct')
    .replace(/\b5ep(t)?\b/gi, 'Sep')
    .replace(/\bN0v\b/gi, 'Nov')
    .replace(/\bJu[1l]\b/gi, 'Jul')
    .replace(/(\d)[Oo](?=\d)/g, (_m, digit: string) => `${digit}0`)
    .replace(/(\d)[lI](?=\d)/g, (_m, digit: string) => `${digit}1`)
}

type DateHit = { index: number; options: string[]; hasYear: boolean }

function findDateHits(rawText: string): DateHit[] {
  const text = fixOcrDateText(rawText)
  const hits: DateHit[] = []
  const thisYear = new Date().getFullYear()

  // 2026-10-26 or 2026/10/26
  for (const m of text.matchAll(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/g)) {
    hits.push({
      index: m.index ?? 0,
      options: [toIsoDate(Number(m[1]), Number(m[2]), Number(m[3]))],
      hasYear: true,
    })
  }

  // 26/10/2026, 26-10-26, 26.10.2026  (DD/MM first, then MM/DD)
  for (const m of text.matchAll(/\b(\d{1,2})([/.-])(\d{1,2})\2(\d{4}|\d{2})\b/g)) {
    if (m[2] === '.' && m[4].length === 2) continue
    const a = Number(m[1])
    const b = Number(m[3])
    let y = Number(m[4])
    if (y < 100) y += 2000
    hits.push({
      index: m.index ?? 0,
      options: [toIsoDate(y, b, a), toIsoDate(y, a, b)],
      hasYear: true,
    })
  }

  // 26 Oct 2026 | 26th October, 2026 | 26-Oct-2026 | 26 Oct'26 | 26 Oct
  const dayFirst = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?[\\s\\-/.,]*(${MONTH_NAMES})\\b\\.?(?:[\\s\\-,.']*(\\d{4})\\b|\\s*'(\\d{2})\\b)?`,
    'gi'
  )
  for (const m of text.matchAll(dayFirst)) {
    const day = Number(m[1])
    const month = MONTH_INDEX[m[2].slice(0, 3).toLowerCase()]
    const year = m[3] ? Number(m[3]) : m[4] ? 2000 + Number(m[4]) : 0
    hits.push({
      index: m.index ?? 0,
      options: [toIsoDate(year || thisYear, month, day)],
      hasYear: Boolean(year),
    })
  }

  // Oct 26, 2026 | October 26 2026 | Oct 26
  const monthFirst = new RegExp(
    `\\b(${MONTH_NAMES})\\b\\.?[\\s\\-/.]*(\\d{1,2})(?:st|nd|rd|th)?\\b(?:[\\s,.\\-']*(\\d{4})\\b)?`,
    'gi'
  )
  for (const m of text.matchAll(monthFirst)) {
    const month = MONTH_INDEX[m[1].slice(0, 3).toLowerCase()]
    const day = Number(m[2])
    const year = m[3] ? Number(m[3]) : 0
    hits.push({
      index: m.index ?? 0,
      options: [toIsoDate(year || thisYear, month, day)],
      hasYear: Boolean(year),
    })
  }

  return hits.sort((a, b) => a.index - b.index)
}

function bestDateInText(text: string): string {
  const today = todayLocal()
  const hits = findDateHits(text)

  // Dates with a year are trusted first; year-less dates ("26 Oct") are a fallback.
  for (const withYear of [true, false]) {
    for (const hit of hits) {
      if (hit.hasYear !== withYear) continue
      for (const option of hit.options) {
        if (option && option <= today) return option
      }
      // A year-less date that lands in the future belongs to last year.
      if (!withYear && hit.options[0]) {
        const [y, m, d] = hit.options[0].split('-').map(Number)
        const previous = toIsoDate(y - 1, m, d)
        if (previous && previous <= today) return previous
      }
    }
  }

  return ''
}

// Each OCR pass votes; the date seen most often wins (ties: earliest pass).
function pickDate(texts: string[]): string {
  const votes = new Map<string, number>()
  for (const text of texts) {
    const date = bestDateInText(text)
    if (date) votes.set(date, (votes.get(date) ?? 0) + 1)
  }

  let best = ''
  let bestVotes = 0
  for (const [date, count] of votes) {
    if (count > bestVotes) {
      best = date
      bestVotes = count
    }
  }
  return best
}

/* ----------------------------- AMOUNTS ------------------------------ */

// OCR rarely returns the rupee sign correctly. These are the characters it
// commonly produces instead (₹ -> R, ¥, %, ?, ~, =, ...).
const GLYPH = '[₹¥€£$%?~=}«»]|R'
const NUM = String.raw`\d[\d,]*(?:\.\d{1,2})?`
const H = String.raw`[^\S\r\n]` // horizontal whitespace only

// Accepts "4,000", "1,25,000", "150", "99.50". Rejects IDs, zero and huge values.
function normalizeAmount(raw: string): string {
  const s = raw.replace(/\.$/, '')
  if (!/^(?:[1-9]\d{0,2}(?:,\d{2,3})+|[1-9]\d*|0)(?:\.\d{1,2})?$/.test(s)) return ''
  const n = Number(s.replace(/,/g, ''))
  if (!Number.isFinite(n) || n <= 0 || n >= 10_000_000) return ''
  return String(n)
}

// The rupee sign is sometimes read as a digit ("₹4,000" -> "34,000", "₹100" -> "2100").
// Returns the value with that first digit removed, only for 4+ digit numbers.
function withoutLeadingGlyphDigit(raw: string): string {
  if (!/^[237]/.test(raw)) return ''
  const digitCount = raw.split('.')[0].replace(/,/g, '').length
  if (digitCount < 4) return ''
  return normalizeAmount(raw.slice(1))
}

const WORD_VALUES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30,
  forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

// "One Hundred Fifty" -> 150. Returns null if any word is not understood.
function wordsToNumber(phrase: string): number | null {
  const tokens = phrase
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w && w !== 'and')

  if (tokens.length === 0) return null

  let total = 0
  let current = 0

  for (const word of tokens) {
    if (word in WORD_VALUES) current += WORD_VALUES[word]
    else if (word === 'hundred') current = (current || 1) * 100
    else if (word === 'thousand') { total += (current || 1) * 1000; current = 0 }
    else if (/^(lakhs?|lacs?)$/.test(word)) { total += (current || 1) * 100000; current = 0 }
    else if (/^crores?$/.test(word)) { total += (current || 1) * 10000000; current = 0 }
    else return null
  }

  return total + current
}

type AmountVote = { value: string; weight: number }

function amountVotesFromText(rawText: string): AmountVote[] {
  const votes: AmountVote[] = []

  // "₹" alone on a line, number on the next line -> join them.
  const text = rawText.replace(/(^|\n)[^\S\r\n]*(₹|Rs\.?|INR)[^\S\r\n]*\n[^\S\r\n]*(?=\d)/gi, '$1$2 ')

  const add = (raw: string, weight: number, mayHaveGlyphDigit: boolean) => {
    const value = normalizeAmount(raw)
    if (!value) return

    const hasCommaOrDecimal = /[,.]/.test(raw)
    const digitCount = raw.split('.')[0].replace(/,/g, '').length
    // Apps print 4+ digit amounts with commas, so "2100" is likely "₹100" with the sign misread.
    const suspicious = mayHaveGlyphDigit && !hasCommaOrDecimal && digitCount >= 4 && /^[237]/.test(raw)

    votes.push({ value, weight: suspicious ? weight * 0.6 : weight })

    if (mayHaveGlyphDigit) {
      const stripped = withoutLeadingGlyphDigit(raw)
      if (stripped) votes.push({ value: stripped, weight: weight * 0.75 })
    }
  }

  const explicitBefore = new RegExp(`(?:₹|\\bRs\\b\\.?|\\bINR\\b)${H}*(${NUM})(?![\\d:/])`, 'i')
  const explicitAfter = new RegExp(`(${NUM})${H}*(?:\\bINR\\b|\\bRs\\b\\.?|\\brupees\\b)`, 'i')
  const labelled = new RegExp(
    `\\b(?:total\\s+amount|amount|total|paid|debited|credited)\\b${H}*[:\\-]?${H}*(?:${GLYPH})?${H}*(${NUM})(?![\\d:/])`,
    'i'
  )
  const standalone = new RegExp(`^(${GLYPH})?${H}?(${NUM})${H}?[^\\w\\s]{0,2}$`)
  const glyphAtEnd = new RegExp(`(?:^|${H})(?:${GLYPH})${H}?(${NUM})${H}*$`)
  const commaAtEnd = new RegExp(`${H}(\\d{1,3}(?:,\\d{2,3})+(?:\\.\\d{1,2})?)${H}*$`)

  for (const line of text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    let m: RegExpMatchArray | null

    if ((m = line.match(explicitBefore)) || (m = line.match(explicitAfter))) {
      add(m[1], 100, false)
    } else if ((m = line.match(labelled))) {
      add(m[1], 60, false)
    } else if ((m = line.match(standalone))) {
      // Standalone number on its own line (the big amount on UPI receipts).
      add(m[2], m[1] ? 70 : 40, !m[1])
    } else if ((m = line.match(glyphAtEnd))) {
      add(m[1], 65, false)
    } else if ((m = line.match(commaAtEnd))) {
      add(m[1], 25, true)
    }
  }

  // "Rupees One Hundred Fifty Only" is the most reliable confirmation.
  const words = text.replace(/\s+/g, ' ').match(/\brupees?\s+([a-z][a-z\s-]*?)\s+only\b/i)
  if (words) {
    const n = wordsToNumber(words[1])
    if (n && n > 0) votes.push({ value: String(n), weight: 120 })
  }

  return votes
}

// Combines every OCR pass and returns the most likely amount plus close alternatives.
function rankAmounts(texts: string[]): { amount: string; options: string[] } {
  const scores = new Map<string, number>()

  for (const text of texts) {
    for (const vote of amountVotesFromText(text)) {
      scores.set(vote.value, (scores.get(vote.value) ?? 0) + vote.weight)
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1])
  if (ranked.length === 0) return { amount: '', options: [] }

  const [amount, top] = ranked[0]
  const options = ranked
    .slice(1)
    .filter(([, score]) => score >= top * 0.6)
    .slice(0, 2)
    .map(([value]) => value)

  return { amount, options }
}

/* ------------------------- TYPE (income/expense) ------------------------- */

const INCOME_WORDS =
  /\b(?:received\s+from|money\s+received|payment\s+received(?!\s+by)|amount\s+received|credited\s+to|credited|refund(?:ed)?|cashback\s+received)\b/i
const EXPENSE_WORDS =
  /\b(?:paid\s+to|paid\s+successfully|payment\s+successful|money\s+sent|sent\s+to|sent\s+successfully|debited|received\s+by|payment\s+to|paid)\b/i

const EXPENSE_LABEL =
  /^(?:paid\s+to|sent\s+to|payment\s+to|transferred\s+to|money\s+sent\s+to|to)(?:\s*[:\-]\s*|\s+|$)(.*)$/i
const INCOME_LABEL =
  /^(?:received\s+from|payment\s+from|money\s+received\s+from|transferred\s+from|from)(?:\s*[:\-]\s*|\s+|$)(.*)$/i

// Looks at whichever clue appears first on the screen.
function detectType(text: string, lines: string[]): { type: TransactionType; certain: boolean } {
  const income = text.search(INCOME_WORDS)
  const expense = text.search(EXPENSE_WORDS)

  if (income >= 0 && (expense < 0 || income < expense)) return { type: 'income', certain: true }
  if (expense >= 0) return { type: 'expense', certain: true }

  for (const line of lines) {
    if (EXPENSE_LABEL.test(line)) return { type: 'expense', certain: true }
    if (INCOME_LABEL.test(line)) return { type: 'income', certain: true }
  }

  return { type: 'expense', certain: false }
}

/* ------------------------------- TITLE ------------------------------- */

const NOT_A_NAME =
  /^(?:paid successfully|payment successful|transaction successful|money sent successfully|successful|success|completed|paid|sent|received|debited|credited|google pay|phonepe|gpay|paytm|upi|upi id|transaction details|transfer details|payment details|view details|done|close|to|from|paid to|received from|payment to|payment from|amount|total|date|time|bank transfer|pay again|share|banking name|powered by(?: upi)?)$/i

function cleanTitle(raw: string): string {
  let value = raw.replace(/[|_]+/g, ' ').replace(/\s+/g, ' ').trim()

  // Remove an amount that OCR glued to the end of the name line ("Giri gouda ¥4,000").
  value = value
    .replace(new RegExp(`\\s+(?:${GLYPH})\\s?\\d[\\d,]*(?:\\.\\d{1,2})?\\s*$`), '')
    .replace(/\s+\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\s*$/, '')

  const tokens = value.split(' ').filter(Boolean)
  const isNoise = (token: string) => !/[A-Za-z]/.test(token) && token.length <= 3

  while (tokens.length > 0 && isNoise(tokens[tokens.length - 1])) tokens.pop()
  while (tokens.length > 0 && isNoise(tokens[0])) tokens.shift()

  // Avatar icons are often read as 1-2 stray lowercase letters ("a Giri gouda").
  if (tokens.length > 2 && /^[a-z]{1,2}$/.test(tokens[0])) tokens.shift()

  return tokens.join(' ').replace(/^[\s:–—-]+|[\s:–—-]+$/g, '').trim()
}

function validTitle(raw: string): string {
  const title = cleanTitle(raw)
  const letters = (title.match(/[A-Za-z]/g) ?? []).length
  const digits = (title.match(/\d/g) ?? []).length

  if (title.length < 2 || title.length > 60) return ''
  if (letters < 2 || digits > letters) return ''
  if (NOT_A_NAME.test(title)) return ''
  if (/@/.test(title)) return ''
  if (/\d{1,2}:\d{2}/.test(title)) return ''
  if (/\b(?:utr|upi|ref|reference|transaction|order|id|ifsc|a\/c|account)\b/i.test(title)) return ''

  return title
}

function findTitle(lines: string[], type: TransactionType): string {
  const labelPattern = type === 'income' ? INCOME_LABEL : EXPENSE_LABEL

  for (let i = 0; i < lines.length; i++) {
    const label = lines[i].match(labelPattern)
    if (!label) continue

    const sameLine = validTitle(label[1])
    if (sameLine) return sameLine

    // The name is often on one of the next few lines.
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const next = validTitle(lines[j])
      if (next) return next
    }
  }

  return ''
}

/* ------------------------------ CATEGORY ------------------------------ */

function suggestCategory(...sources: string[]): string {
  const rules: [RegExp, string][] = [
    [/\b(?:restaurants?|food|swiggy|zomato|cafe|hotel|pizza|grocery|groceries|supermarket|bakery)\b/, 'Food'],
    [/\b(?:uber|ola|rapido|metro|bus|train|irctc|flight|petrol|fuel|redbus)\b/, 'Travel'],
    [/\b(?:salary|payroll|stipend)\b/, 'Salary'],
    [/\b(?:college|school|tuition|course|exam|education|university)\b/, 'Education'],
    [/\b(?:electricity|recharge|bill|broadband|water|gas)\b/, 'Bills'],
    [/\b(?:movie|cinema|game|netflix|spotify|hotstar)\b/, 'Entertainment'],
    [/\b(?:amazon|flipkart|myntra|shopping|store|mall)\b/, 'Shopping'],
  ]

  for (const source of sources) {
    const value = source.toLowerCase()
    for (const [pattern, category] of rules) {
      if (pattern.test(value)) return category
    }
  }

  return 'Other'
}

/* ------------------------------ MAIN PARSER ------------------------------ */

// Takes the text of one or more OCR passes of the same screenshot.
function parseTransactions(rawTexts: string[]): ParsedTransaction {
  const texts = rawTexts
    .map((text) => text.replace(/\u00A0/g, ' ').trim())
    .filter(Boolean)

  const linesOf = (text: string) =>
    text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

  const { amount, options } = rankAmounts(texts)

  // Type: first pass that finds a clear clue wins.
  let type: TransactionType = 'expense'
  for (const text of texts) {
    const detected = detectType(text, linesOf(text))
    if (detected.certain) {
      type = detected.type
      break
    }
  }

  let title = ''
  for (const text of texts) {
    title = findTitle(linesOf(text), type)
    if (title) break
  }

  return {
    amount,
    amountOptions: options,
    title,
    date: pickDate(texts),
    type,
    category: suggestCategory(title, texts[0] ?? ''),
  }
}

// Stop scanning extra passes once everything is found and the amount is unambiguous.
function isComplete(parsed: ParsedTransaction): boolean {
  return Boolean(
    parsed.amount && parsed.date && parsed.title && parsed.amountOptions.length === 0
  )
}

// =====================================================================
// PARSER END
// =====================================================================

// Prepares the screenshot for OCR: enlarges it, turns dark-mode screenshots
// into dark-text-on-light, and stretches the contrast.
async function enhanceImage(file: File): Promise<HTMLCanvasElement | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(
      Math.max(1, 1600 / bitmap.width),
      4000 / Math.max(bitmap.width, bitmap.height)
    )

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return null

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    const gray = new Uint8ClampedArray(pixels.length / 4)
    const histogram = new Array<number>(256).fill(0)
    let sum = 0

    for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
      const value = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2])
      gray[p] = value
      histogram[value]++
      sum += value
    }

    const invert = sum / gray.length < 128

    // Ignore the darkest/lightest 1% so one stray pixel cannot flatten the contrast.
    const cut = gray.length * 0.01
    let low = 0
    let high = 255
    for (let acc = 0; low < 255; low++) {
      acc += histogram[low]
      if (acc > cut) break
    }
    for (let acc = 0; high > 0; high--) {
      acc += histogram[high]
      if (acc > cut) break
    }
    const range = Math.max(1, high - low)

    for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
      let value = Math.min(255, Math.max(0, ((gray[p] - low) * 255) / range))
      if (invert) value = 255 - value
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value
      pixels[i + 3] = 255
    }

    context.putImageData(imageData, 0, 0)
    return canvas
  } catch {
    return null
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
  const [amountOptions, setAmountOptions] = useState<string[]>([])

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
    setAmountOptions([])
    setProgress(0)
  }

  async function scanImage() {
    if (!file) return

    setScanning(true)
    setError('')
    setNotice('')
    setRawText('')
    setReviewReady(false)
    setAmountOptions([])
    setProgress(0)

    let worker: Awaited<ReturnType<typeof createWorker>> | undefined

    try {
      // Dark-mode screenshots are inverted and enlarged so the text (and the
      // rupee sign) is read far more reliably.
      const enhanced = await enhanceImage(file)

      const passes: { image: File | HTMLCanvasElement; mode: PSM }[] = []
      if (enhanced) {
        passes.push({ image: enhanced, mode: PSM.AUTO })
        passes.push({ image: enhanced, mode: PSM.SPARSE_TEXT })
      }
      passes.push({ image: file, mode: PSM.AUTO })

      let currentPass = 0

      worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (message.status === 'recognizing text') {
            const done = currentPass + (message.progress ?? 0)
            setProgress(Math.min(100, Math.round((done / passes.length) * 100)))
          }
        },
      })

      const texts: string[] = []
      let parsed = parseTransactions([])

      // Extra passes only run when something is missing or the amount is unsure.
      for (currentPass = 0; currentPass < passes.length; currentPass++) {
        await worker.setParameters({ tessedit_pageseg_mode: passes[currentPass].mode })
        const result = await worker.recognize(passes[currentPass].image)
        const text = result.data.text.trim()
        if (text) texts.push(text)

        parsed = parseTransactions(texts)
        if (isComplete(parsed)) break
      }

      setProgress(100)
      setRawText(texts.join('\n\n----- next scan pass -----\n\n'))

      if (texts.length === 0) {
        setError('No readable text found. Try a clearer screenshot.')
        return
      }

      setAmount(parsed.amount)
      setAmountOptions(parsed.amountOptions)
      setTitle(parsed.title)
      setDate(parsed.date)
      setType(parsed.type)
      setCategory(parsed.category)
      setNotes('')
      setReviewReady(true)

      const missing = [
        !parsed.amount && 'amount',
        !parsed.date && 'date',
        !parsed.title && 'name',
      ].filter(Boolean)

      if (parsed.amountOptions.length > 0) {
        setNotice(
          'The scanner is not sure about the amount (the ₹ sign can be read as a digit). Check it, or tap one of the other readings.'
        )
      } else if (missing.length > 0) {
        setNotice(`Could not detect: ${missing.join(', ')}. Please fill ${missing.length > 1 ? 'them' : 'it'} in before saving.`)
      } else {
        setNotice(
          'Review the suggested details below. Anything not detected correctly must be corrected before saving.'
        )
      }
    } catch (err) {
      console.error(err)
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
      setAmountOptions([])
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
            onChange={(event) => {
                chooseImage(event.target.files?.[0])
                event.target.value = ''
              }}
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

                <div>
                  <label className="text-sm">
                    Amount (₹)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value)
                        setAmountOptions([])
                      }}
                      placeholder="0.00"
                      required
                      className="mt-2 w-full rounded-xl border border-line/10 bg-black/10 px-3 py-3 text-ink outline-none focus:border-cyan-400"
                    />
                  </label>

                  {amountOptions.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-mute">Other readings:</span>
                      {amountOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setAmount(option)
                            setAmountOptions([])
                          }}
                          className="rounded-full border border-line/10 px-3 py-1 text-ink hover:border-cyan-400"
                        >
                          ₹{Number(option).toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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