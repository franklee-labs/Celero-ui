import { Routes, Route, Navigate } from 'react-router-dom'
import CreateRulePage from './pages/rule/CreateRulePage'

function App() {
  return (
    <Routes>
      <Route path="/rule/create" element={<CreateRulePage />} />
      <Route path="*" element={<Navigate to="/rule/create" replace />} />
    </Routes>
  )
}

export default App
