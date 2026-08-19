import { Navigate, Route, Routes } from 'react-router-dom'

import { SetupNotice } from './components/SetupNotice'
import { supabaseConfigured } from './lib/supabase'
import { Court } from './routes/Court'
import { Home } from './routes/Home'

export function App() {
  // Without credentials every route would just render a fetch error, so say
  // what is actually wrong instead.
  if (!supabaseConfigured) return <SetupNotice />

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/c/:courtId" element={<Court />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
