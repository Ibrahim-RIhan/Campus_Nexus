import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex space-x-4 items-center">
                        <Link to="/" className="text-xl font-bold">CampusNexus</Link>
                        {user && (
                            <>
                                <Link to="/catalog" className="hover:text-blue-200">Catalog</Link>
                                <Link to="/events" className="hover:text-blue-200">Events</Link>
                                <Link to="/my-rentals" className="hover:text-blue-200">My Rentals</Link>
                                {user.role === 'Provider' && (
                                    <Link to="/dashboard" className="hover:text-blue-200">Dashboard</Link>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <span>{user.name} ({user.role})</span>
                                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="hover:text-blue-200">Login</Link>
                                <Link to="/register" className="bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
