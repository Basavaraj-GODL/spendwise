// Money is always integer paise in the database; convert only at the edges.
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })
export const formatINR = (paise: number): string => inr.format(paise / 100)
export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100)
