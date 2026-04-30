import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

import Landing from "./pages/landing";
import Listings from "./pages/listings";
import Login from "./auth/login";
import Register from "./auth/register";
import ProtectedRoute from "./protected-route";

function App() {
  const isAuth = localStorage.getItem("isLoggedIn") === "true";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuth ? <Navigate to="/listings" /> : <Landing />} />
        <Route path="/login" element={isAuth ? <Navigate to="/listings" /> : <Login />} />
        <Route path="/register" element={isAuth ? <Navigate to="/listings" /> : <Register />} />
        <Route path="/listings" element={<ProtectedRoute> <Listings /> </ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;