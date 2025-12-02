import { Terminal, Database, Cloud, Shield } from 'lucide-react';

export default function TechnicalManual() {
  return (
    <div className="space-y-12">
      {/* Cover Page */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center border-b-2 border-stone-900 pb-12">
        <div className="w-32 h-32 bg-stone-900 text-white flex items-center justify-center rounded-full mb-8">
          <Terminal className="w-16 h-16" />
        </div>
        <h1 className="text-6xl font-bold tracking-tight mb-4">TECHNICAL MANUAL</h1>
        <p className="text-2xl text-stone-600 italic">Architecture & Maintenance</p>
        <div className="mt-auto pt-24 text-sm text-stone-500">
          <p>HUDEMAS ART S.R.L.</p>
          <p>Updated: December 2025</p>
        </div>
      </div>

      {/* Stack */}
      <div className="page-break pt-12">
        <h2 className="text-3xl font-bold mb-6 border-b border-stone-200 pb-2">1. Architecture Overview</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
            <TechCard title="Frontend" desc="Next.js 16 (App Router)" icon={<Cloud />} />
            <TechCard title="Database" desc="Supabase (PostgreSQL)" icon={<Database />} />
            <TechCard title="Styling" desc="Tailwind CSS 4" icon={<span className="font-bold text-lg">Tw</span>} />
            <TechCard title="Hosting" desc="Vercel" icon={<span className="font-bold text-lg">▲</span>} />
        </div>
        <p className="text-lg leading-relaxed">
            The system is built on a serverless architecture. It requires zero infrastructure maintenance. The database handles authentication, storage, and relational data.
        </p>
      </div>

      {/* Env Vars */}
      <div className="pt-12">
        <h2 className="text-3xl font-bold mb-8 border-b border-stone-200 pb-2">2. Environment Variables</h2>
        <div className="bg-stone-900 text-stone-300 p-6 rounded-xl font-mono text-sm overflow-x-auto">
            <p><span className="text-purple-400">NEXT_PUBLIC_SUPABASE_URL</span>=https://xyz.supabase.co</p>
            <p><span className="text-purple-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=eyJ...</p>
            <p><span className="text-purple-400">SUPABASE_SERVICE_ROLE_KEY</span>=eyJ... <span className="text-stone-500">// Critical</span></p>
            <p><span className="text-purple-400">STRIPE_SECRET_KEY</span>=sk_test_...</p>
            <p><span className="text-purple-400">RESEND_API_KEY</span>=re_123...</p>
        </div>
      </div>

      {/* Deployment */}
      <div className="page-break pt-12">
        <h2 className="text-3xl font-bold mb-8 border-b border-stone-200 pb-2">3. Deployment Cycle</h2>
        <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border border-stone-200 rounded-lg">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">1</div>
                <p>Developer pushes code to <strong>GitHub (main branch)</strong>.</p>
            </div>
            <div className="flex items-center gap-4 p-4 border border-stone-200 rounded-lg">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">2</div>
                <p>Vercel detects the commit and starts a <strong>Production Build</strong>.</p>
            </div>
            <div className="flex items-center gap-4 p-4 border border-stone-200 rounded-lg">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">3</div>
                <p>If build succeeds, the new version is <strong>Live instantly</strong>.</p>
            </div>
        </div>
      </div>
    </div>
  );
}

function TechCard({ title, desc, icon }: any) {
    return (
        <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
            <div className="text-stone-400">{icon}</div>
            <div>
                <h4 className="font-bold">{title}</h4>
                <p className="text-xs text-stone-500">{desc}</p>
            </div>
        </div>
    );
}
