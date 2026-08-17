import { createContext, useContext, useState, useCallback } from "react";
import * as authApi from "../api/auth";

//this creates the authContext
const AuthContext = createContext(null);

//current logged in user
const readStoredUser = () => {
  const raw = localStorage.getItem("fleet_user");
  return raw ? JSON.parse(raw) : null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = useCallback(async (email, password) => {
    //login the user
    const data = await authApi.login(email, password);

    localStorage.setItem("fleet_token", data.token);
    localStorage.setItem("fleet_user", JSON.stringify(data.user));

    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("fleet_token");
    localStorage.removeItem("fleet_user");

    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);