// src/components/RequireCreator.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isCreatorSignedIn } from "../lib/auth";

export default function RequireCreator({ children }) {
  const location = useLocation();
  if (!isCreatorSignedIn()) {
    return <Navigate to="/registrazione-creator" state={{ from: location }} replace />;
  }
  return children;
}
