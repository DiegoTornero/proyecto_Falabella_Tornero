import { createContext, useContext, useEffect, useState } from "react"
import api from "../lib/api"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaurar sesión desde localStorage al recargar la página
    const token = localStorage.getItem("token")
    const userId = localStorage.getItem("user_id")
    if (token && userId) {
      setUser({ id: userId })
    }
    setLoading(false)
  }, [])

  const login = async (dni, password) => {
    try {
      const response = await api.post("/auth/login", { dni, password })
      const { access_token, user_id } = response.data

      localStorage.setItem("token", access_token)
      localStorage.setItem("user_id", user_id)
      setUser({ id: user_id })

      return { data: response.data, error: null }
    } catch (err) {
      const msg = err.response?.data?.detail || "Error al iniciar sesión"
      return { data: null, error: { message: msg } }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData)
      const { access_token, user_id } = response.data

      localStorage.setItem("token", access_token)
      localStorage.setItem("user_id", user_id)
      setUser({ id: user_id })

      return { data: response.data, error: null }
    } catch (err) {
      const msg = err.response?.data?.detail || "Error al registrarse"
      return { data: null, error: { message: msg } }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user_id")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)