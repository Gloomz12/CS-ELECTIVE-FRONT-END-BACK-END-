import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import Landing from "./pages/landing";
import Home from "./pages/home";
import Login from "./auth/login";
import Register from "./auth/register";
import ProtectedRoute from "./protected-route";

function App() {
  const isAuth = localStorage.getItem("isLoggedIn") === "true";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuth ? <Navigate to="/home" /> : <Landing />} />
        <Route path="/login" element={isAuth ? <Navigate to="/home" /> : <Login />} />
        <Route path="/register" element={isAuth ? <Navigate to="/home" /> : <Register />} />
        <Route path="/home" element={ <ProtectedRoute> <Home /> </ProtectedRoute>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;