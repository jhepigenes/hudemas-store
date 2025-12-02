import { Package, Truck, User, MessageSquare, ClipboardList, Box } from 'lucide-react';

export default function StaffManual() {
  return (
    <div className="space-y-12">
      {/* Cover Page */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center border-b-2 border-stone-900 pb-12">
        <div className="w-32 h-32 bg-stone-900 text-white flex items-center justify-center rounded-full mb-8">
          <ClipboardList className="w-16 h-16" />
        </div>
        <h1 className="text-6xl font-bold tracking-tight mb-4">STAFF MANUAL</h1>
        <p className="text-2xl text-stone-600 italic">Daily Operations & Fulfillment</p>
        <div className="mt-auto pt-24 text-sm text-stone-500">
          <p>HUDEMAS ART S.R.L.</p>
          <p>Updated: December 2025</p>
        </div>
      </div>

      {/* Introduction */}
      <div className="page-break pt-12">
        <h2 className="text-3xl font-bold mb-6 border-b border-stone-200 pb-2">1. Introduction</h2>
        <p className="text-lg leading-relaxed mb-4">
          Welcome to the Hudemas team. This manual is your guide to ensuring every customer receives their Gobelin kit quickly, accurately, and with the care our heritage brand is known for.
        </p>
        <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 flex gap-4 items-start">
          <div className="bg-stone-900 text-white p-2 rounded-full shrink-0">
            <StarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold mb-1">Golden Rule</h3>
            <p>Every package is a gift. We don't just ship products; we ship the start of a creative journey.</p>
          </div>
        </div>
      </div>

      {/* Daily Order Processing */}
      <div className="pt-12">
        <h2 className="text-3xl font-bold mb-8 border-b border-stone-200 pb-2">2. Daily Order Processing</h2>
        
        <div className="grid grid-cols-1 gap-8">
          <Step 
            number={1} 
            title="Check New Orders" 
            icon={<ClipboardList className="w-6 h-6" />}
            desc="Log in to the Admin Panel and go to 'Daily Operations'. Filter by 'Pending' status."
          />
          <Step 
            number={2} 
            title="Print AWB & Invoice" 
            icon={<PrinterIcon className="w-6 h-6" />}
            desc="Click 'Invoice PDF' and 'AWB Label' for each order. Print them out."
          />
          <Step 
            number={3} 
            title="Pick & Pack" 
            icon={<Package className="w-6 h-6" />}
            desc="Retrieve the correct kit code. Double-check thread quantities if 'Complete Kit' is selected."
          />
          <Step 
            number={4} 
            title="Handover to Courier" 
            icon={<Truck className="w-6 h-6" />}
            desc="Stick the AWB on the box. Hand it to the FanCourier/Sameday driver."
          />
          <Step 
            number={5} 
            title="Mark as Shipped" 
            icon={<CheckCircleIcon className="w-6 h-6" />}
            desc="In the Admin Panel, select the orders and click 'Mark as Shipped'. This notifies the customer."
          />
        </div>
      </div>

      <div className="page-break pt-12">
        <h2 className="text-3xl font-bold mb-8 border-b border-stone-200 pb-2">3. Customer Service</h2>
        
        <div className="flex gap-8 mb-8">
            <div className="flex-1 bg-white border-2 border-stone-100 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                    <User className="w-8 h-8 text-stone-900" />
                    <h3 className="text-xl font-bold">Updating Customer Info</h3>
                </div>
                <p className="text-stone-600">
                    If a customer calls to change their address:
                    1. Go to <strong>CRM</strong> tab.
                    2. Search for their name.
                    3. Click <strong>Edit</strong> and update the details.
                </p>
            </div>
            <div className="flex-1 bg-white border-2 border-stone-100 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-8 h-8 text-stone-900" />
                    <h3 className="text-xl font-bold">Review Moderation</h3>
                </div>
                <p className="text-stone-600">
                    Check <strong>Marketing & SEO</strong> daily. Approve genuine reviews with photos to appear on the homepage.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, icon, desc }: any) {
  return (
    <div className="flex items-start gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-lg">
          {number}
        </div>
        <div className="h-full w-px bg-stone-200 min-h-[20px]"></div>
      </div>
      <div className="flex-1 pb-8 border-b border-stone-100">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-stone-100 rounded-lg">{icon}</div>
            <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <p className="text-stone-600">{desc}</p>
      </div>
    </div>
  );
}

// Icons placeholders
const StarIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const PrinterIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const CheckCircleIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
