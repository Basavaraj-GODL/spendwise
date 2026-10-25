import { Link } from 'react-router-dom'
export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold" aria-label="SpendWise home">
      <span className="grid h-8 w-8 place-items-center rounded-lg text-[#ff7b00]" style={{ fontStyle: 'bold'  }}>₹</span>
      SpendWise
    </Link>
  )
}
