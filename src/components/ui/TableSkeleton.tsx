import React from 'react'
import { Badge } from './Badge'

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number, cols?: number }) {
  return (
    <div className="w-full animate-pulse border-collapse">
       <div className="flex w-full bg-slate-50 border-b border-slate-200">
         {[...Array(cols)].map((_, i) => (
           <div key={`th-${i}`} className="px-6 py-4 flex-1">
             <div className="h-4 bg-slate-200 rounded w-1/2"></div>
           </div>
         ))}
       </div>
       <div className="divide-y divide-slate-100">
         {[...Array(rows)].map((_, i) => (
           <div key={`tr-${i}`} className="flex w-full bg-white">
             {[...Array(cols)].map((_, j) => (
                <div key={`td-${i}-${j}`} className="px-6 py-4 flex-1">
                  <div className={`h-4 bg-slate-100 rounded ${j === 0 ? 'w-3/4' : j === cols - 1 ? 'w-1/4 ml-auto' : 'w-1/2'}`}></div>
                </div>
             ))}
           </div>
         ))}
       </div>
    </div>
  )
}
