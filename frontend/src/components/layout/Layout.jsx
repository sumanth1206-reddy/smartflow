import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ darkMode, setDarkMode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={`app-shell${darkMode ? ' dark-theme' : ''}`}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="main-shell">
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="content">
          <Outlet context={{ darkMode, setDarkMode }} />
        </main>
        <Footer />
      </div>
    </div>
  )
}
