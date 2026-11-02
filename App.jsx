import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Universidad from './pages/Universidad'
import Finanzas from './pages/Finanzas'
import AsesorIA from './pages/AsesorIA'
import Horario from './pages/Horario'
import Calendario from './pages/Calendario'
import Agenda from './pages/Agenda'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/universidad" element={<Universidad />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/ia" element={<AsesorIA />} />
        <Route path="/horario" element={<Horario />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/agenda" element={<Agenda />} />
      </Route>
    </Routes>
  )
}
