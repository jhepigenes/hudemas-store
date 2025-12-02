import { TrendingUp, Landmark, Users, Tag } from 'lucide-react';

export default function OwnerManual() {
  return (
    <div className="space-y-12">
      {/* Cover Page */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center border-b-2 border-stone-900 pb-12">
        <div className="w-32 h-32 bg-stone-900 text-white flex items-center justify-center rounded-full mb-8">
          <Landmark className="w-16 h-16" />
        </div>
        <h1 className="text-6xl font-bold tracking-tight mb-4">OWNER MANUAL</h1>
        <p className="text-2xl text-stone-600 italic">Strategy, Financials & Growth</p>
        <div className="mt-auto pt-24 text-sm text-stone-500">
          <p>HUDEMAS ART S.R.L.</p>
          <p>Updated: December 2025</p>
        </div>
      </div>

      {/* Introduction */}
      <div className="page-break pt-12">
        <h2 className="text-3xl font-bold mb-6 border-b border-stone-200 pb-2">1. Platform Strategy</h2>
        <p className="text-lg leading-relaxed mb-8">
          The new Hudemas platform is designed for scalability. It is not just a shop; it is a community hub and a marketplace.
        </p>
        
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                <h3 className="font-bold text-xl mb-2">Direct Sales</h3>
                <p className="text-sm text-stone-600">High-margin Gobelin kits produced in-house.</p>
            </div>
            <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                <h3 className="font-bold text-xl mb-2">Marketplace</h3>
                <p className="text-sm text-stone-600">Commission-based sales from approved artists.</p>
            </div>
        </div>
      </div>

      {/* Financials */}
      <div className="pt-12">
        <h2 className="text-3xl font-bold mb-8 border-b border-stone-200 pb-2">2. Financial Management</h2>
        
        <div className="flex items-start gap-6 mb-12">
            <div className="bg-stone-900 text-white p-4 rounded-xl">
                <TrendingUp className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-2xl font-bold mb-2">Monthly Accounting</h3>
                <p className="mb-4">Your accountant needs the monthly sales report. Do this on the 1st of every month:</p>
                <ol className="list-decimal list-inside space-y-2 font-medium">
                    <li>Go to <strong>Financials</strong> tab.</li>
                    <li>Select Date Range (Previous Month).</li>
                    <li>Click <strong>Export Accounting CSV</strong>.</li>
                    <li>Email the file.</li>
                </ol>
            </div>
        </div>
      </div>

      <div className="page-break pt-12">
        <h2 className="text-3xl font-bold mb-8 border-b border-stone-200 pb-2">3. Marketing Tools</h2>
        
        <div className="grid grid-cols-1 gap-8">
            <div className="flex gap-6 p-6 border border-stone-200 rounded-xl">
                <Tag className="w-10 h-10 text-stone-400" />
                <div>
                    <h3 className="text-xl font-bold mb-2">Coupons & Sales</h3>
                    <p className="text-stone-600 mb-2">Create seasonal campaigns easily.</p>
                    <ul className="list-disc list-inside text-sm text-stone-500">
                        <li>Use 'Fixed Amount' for high-value items.</li>
                        <li>Use 'Percentage' for clearing stock.</li>
                        <li>Always set a 'Max Uses' limit for safety.</li>
                    </ul>
                </div>
            </div>
            
            <div className="flex gap-6 p-6 border border-stone-200 rounded-xl">
                <Users className="w-10 h-10 text-stone-400" />
                <div>
                    <h3 className="text-xl font-bold mb-2">Newsletter</h3>
                    <p className="text-stone-600">
                        The 'Subscribers' list grows automatically from the website popup. Use the built-in tool to send updates about new collections.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
