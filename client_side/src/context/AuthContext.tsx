import { createContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

export const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------
  // APPLY TOKEN TO AXIOS + LOCALSTORAGE
  // ------------------------------------------------------
  const applyToken = (jwt: string | null) => {
    if (jwt) {
      localStorage.setItem("token", jwt);
      axiosClient.defaults.headers["Authorization"] = `Bearer ${jwt}`;
    } else {
    //   localStorage.removeItem("token");
      console.log("token now is not removed");
      delete axiosClient.defaults.headers["Authorization"];
    }
    setToken(jwt);
  };

  // ------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------
  const login = async (email: string, password: string) => {
    const res = await axiosClient.post("/auth/login", { email, password });
    const payload = res.data.payload;

    applyToken(payload.token);
    setUser(payload);

    return true;
  };

  // ------------------------------------------------------
  // REGISTER
  // ------------------------------------------------------
  const register = async (data: any) => {
    const res = await axiosClient.post("/auth/register", data);
    const payload = res.data.payload;

    applyToken(payload.token);
    setUser(payload);

    return true;
  };

  // ------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------
  const logout = () => {
    applyToken(null);
    localStorage.removeItem("household_id"); // REMOVE ONLY ON LOGOUT
    setUser(null);

    window.location.href = "/login";
  };

  // ------------------------------------------------------
  // RESTORE SESSION ON PAGE REFRESH
  // ------------------------------------------------------
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    console.log("after refresh", savedToken);
    if (!savedToken) {
      setLoading(false);
      return;
    }

    // Restore token immediately BEFORE loading user
    applyToken(savedToken);

    async function loadUser() {
      try {
        const res = await axiosClient.get("/auth/user");
        setUser(res.data.payload);
      } catch (error) {
        // Token invalid → clear session
        applyToken(null);
        localStorage.removeItem("household_id");
      }

      setLoading(false);
    }

    loadUser();
  }, []);

  // ------------------------------------------------------
  // BLOCK APP UNTIL AUTH LOADED
  // ------------------------------------------------------
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
