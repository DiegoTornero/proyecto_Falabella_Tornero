import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import Login from "./pages/Auth/Login"
import Register from "./pages/Auth/Register"
import Dashboard from "./pages/Dashboard/Dashboard"
import Ahorros from "./pages/Ahorros/Ahorros"
import Creditos from "./pages/Creditos/Creditos"
import Transferencias from "./pages/Transferencias/Transferencias"
import Perfil from "./pages/Perfil/Perfil"
import PagoServicios from "./pages/Servicios/PagoServicios"
function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/ahorros" element={<PrivateRoute><Ahorros /></PrivateRoute>} />
        <Route path="/creditos" element={<PrivateRoute><Creditos /></PrivateRoute>} />
        <Route path="/transferencias" element={<PrivateRoute><Transferencias /></PrivateRoute>} />
        <Route path="/servicios" element={<PrivateRoute><PagoServicios /></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}