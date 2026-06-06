import Link from 'next/link';
import { Flame, ArrowLeft } from '@phosphor-icons/react/dist/ssr';

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/15">
          <Flame size={36} weight="fill" className="text-white" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-medium mb-2">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 mb-2">
          Seite nicht gefunden
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed mb-8">
          Diese Seite existiert nicht. Kehren Sie zum Sprachassistenten zurueck.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors shadow-md shadow-stone-900/10"
        >
          <ArrowLeft size={16} weight="bold" />
          Zum Sprachassistenten
        </Link>
      </div>
    </main>
  );
}
