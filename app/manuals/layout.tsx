'use client';

export default function ManualsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-stone-900 font-serif print:bg-white print:text-black">
      <div className="mx-auto max-w-4xl p-12 print:p-0">
        {children}
      </div>
      <style jsx global>{`
        @media print {
          @page {
            margin: 2cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-break {
            break-before: page;
          }
        }
      `}</style>
    </div>
  );
}
