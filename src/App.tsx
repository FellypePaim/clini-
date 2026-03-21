
import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './router/AppRouter'
import { initAuth } from './store/authStore'

function App() {
  useEffect(() => {
    initAuth()
  }, [])

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

export default App
