import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import './App.css';

// Parent Pages
import Login from "./auth/login";
import Register from "./auth/register";
import Landing from "./pages/landing";
import Main from "./pages/main";

// Child Pages
import Home from "./pages/homepage";

import Listings from "./pages/listings";
import PropertyDetails from "./pages/propertyDetailsView";
import InquireProperty from "./pages/inquireProperty";

import Rentings from "./pages/rentings";
import LeasingInformation from "./pages/leasingInformation";

import MyProperties from "./pages/myProperties";



import ProtectedRoute from "./protected-route";

function App() {

  const isAuth = localStorage.getItem("isLoggedIn") === "true";

  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH/PUBLIC ROUTES */}
        <Route path="/" element={isAuth ? <Navigate to="/main/home" /> : <Landing />} />
        <Route path="/login" element={isAuth ? <Navigate to="/main/home" /> : <Login />} />
        <Route path="/register" element={isAuth ? <Navigate to="/main/home" /> : <Register />} />


        {/* PARENT ROUTE */}
        <Route path="/main" element={<ProtectedRoute><Main /></ProtectedRoute>}>

          {/* CHILD ROUTES */}
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />

          <Route path="rentings" element={<Rentings />} />
          <Route path="leasing-information/:propertyName" element={<LeasingInformation />} />

          <Route path="listings" element={<Listings />} />
          <Route path="properties/:propertyName" element={<PropertyDetails />} />
          <Route path="properties/:propertyName/inquire" element={<InquireProperty />} />


          <Route path="my-properties" element={<MyProperties />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;