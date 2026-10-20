import { Link } from 'react-router-dom'
import { Construction } from 'lucide-react'
export default function Unavailable({ title, stage, inShell }: { title: string; stage: string; inShell?: boolean }) {
  return (
    <div className={`grid place-items-center p-8 text-center ${inShell ? 'min-h-[60vh]' : 'min-h-screen'}`}>
      <div className="glass max-w-md rounded-2xl p-8">
        <Construction className="mx-auto mb-4 text-cyan" />
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-mute">{stage ? `This screen isn't built yet. It arrives in ${stage}.` : "That page doesn't exist."}</p>
        <Link to={inShell ? '/app' : '/'} className="btn btn-primary mt-6">{inShell ? 'Back to dashboard' : 'Back to home'}</Link>
      </div>
    </div>
  )
}
