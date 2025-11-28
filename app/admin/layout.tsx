import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
