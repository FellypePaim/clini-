import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const SIDEBAR_WIDTH = 240 // 60 * 4 = 240px (w-60)

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header sidebarWidth={SIDEBAR_WIDTH} />

      {/* ── Área de conteúdo ───────────────────── */}
      <main
        className="min-h-screen transition-all duration-200"
        style={{ paddingLeft: SIDEBAR_WIDTH, paddingTop: 64 }}
      >
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
