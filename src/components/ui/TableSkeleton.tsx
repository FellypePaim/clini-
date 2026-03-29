import React from 'react'

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number, cols?: number }) {
  return (
    <div className="w-full animate-pulse border-collapse">
       <div className="flex w-full bg-[var(--color-bg-deep)] border-b border-[var(--color-border)]">
         {[...Array(cols)].map((_, i) => (
           <div key={`th-${i}`} className="px-6 py-4 flex-1">
             <div className="h-4 bg-[var(--color-border)] rounded w-1/2"></div>
           </div>
         ))}
       </div>
       <div className="divide-y divide-[var(--color-border)]">
         {[...Array(rows)].map((_, i) => (
           <div key={`tr-${i}`} className="flex w-full bg-[var(--color-bg-card)]">
             {[...Array(cols)].map((_, j) => (
                <div key={`td-${i}-${j}`} className="px-6 py-4 flex-1">
                  <div className={`h-4 bg-[var(--color-bg-card)] rounded ${j === 0 ? 'w-3/4' : j === cols - 1 ? 'w-1/4 ml-auto' : 'w-1/2'}`}></div>
                </div>
             ))}
           </div>
         ))}
       </div>
    </div>
  )
}
