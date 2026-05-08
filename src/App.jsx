import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import './App.css';

// Parent Pages
import Login from "./auth/login";
import Register from "./auth/register";
import Landing from "./pages/landing";
import Main from "./pages/main";

// Child Pages
import UserSettings from "./pages/userSettings";

import Home from "./pages/homepage";

import Listings from "./pages/listings";
import PropertyDetails from "./pages/propertyDetailsView";
import InquireProperty from "./pages/inquireProperty";

import Rentings from "./pages/rentings";
import LeasingInformation from "./pages/leasingInformation";

import MyProperties from "./pages/myProperties";
import AddProperty from "./pages/addProperty";
import InquiriesList from "./pages/inquiriesList";
import MyPropertyDetailsView from "./pages/myPropertyDetailsView";
import EditProperty from "./pages/editProperty";



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
          <Route path="user-settings" element={<UserSettings />} />

          <Route path="home" element={<Home />} />

          <Route path="rentings" element={<Rentings />} />
          <Route path="leasing-information/:propertyName" element={<LeasingInformation />} />

          <Route path="listings" element={<Listings />} />
          <Route path="properties/:propertyName" element={<PropertyDetails />} />
          <Route path="properties/:propertyName/inquire" element={<InquireProperty />} />


          <Route path="my-properties" element={<MyProperties />} />
          <Route path="my-properties/details/:propertyName" element={<MyPropertyDetailsView />} />
          <Route path="my-properties/inquires-list" element={<InquiriesList />} />
          <Route path="my-properties/add-property" element={<AddProperty />} />
          <Route path="my-properties/details/:propertyName/edit-information" element={<EditProperty />} />

        </Route>

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>

  );
}

export default App;