import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import ItemDetail from './pages/ItemDetail';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import MyRentals from './pages/MyRentals';

const Home = () => {
  const { user, logout } = React.useContext(AuthContext);
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-blue-800">Welcome to CampusNexus</h1>
      {user ? (
        <div className="bg-white p-6 rounded-lg shadow max-w-md">
          <p className="mb-4 text-lg">Hello, <span className="font-semibold">{user.name}</span>!</p>
          <p className="mb-4 text-gray-600">Your role: {user.role}</p>
          <button onClick={logout} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded">Logout</button>
        </div>
      ) : (
        <Navigate to="/login" />
      )}
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
            <Route path="/items/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/my-rentals" element={<ProtectedRoute><MyRentals /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
