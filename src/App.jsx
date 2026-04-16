import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import Register from "./components/Register";
import HomePage from "./components/Dashboard";
import ProfilePage from "./components/ProfilePage";
import MessagesPage from "./components/MessagesPage";
import SearchUsersPage from "./components/SearchUsersPage";
import ManageConnectionsPage from "./components/ManageConnectionsPage";
import UserProfileViewPage from "./components/UserProfileViewPage";
import LandingPage from "./components/LandingPage";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const authToken = localStorage.getItem("authToken");
  return authToken ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected pages */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search-users"
            element={
              <ProtectedRoute>
                <SearchUsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manage-connections"
            element={
              <ProtectedRoute>
                <ManageConnectionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/:userId/profile"
            element={
              <ProtectedRoute>
                <UserProfileViewPage />
              </ProtectedRoute>
            }
          />

          {/* Optional: keep old /dashboard links working */}
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;