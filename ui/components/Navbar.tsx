import Link from "next/link"
import { Star } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="sticky font-sans top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-around px-10">
        
        {/* Logo / Title */}
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-white hover:opacity-90"
        >
          Commitry
        </Link>

        {/* Right side */}
        <Link
          href="https://github.com/yofabr/commitry"
          target="_blank"
          className="group flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/90 transition hover:border-white/30 hover:bg-white/5"
        >
          <Star className="h-4 w-4 fill-transparent transition group-hover:fill-yellow-400 group-hover:text-yellow-400" />
          <span>Star</span>
        </Link>

      </div>
    </nav>
  )
}
