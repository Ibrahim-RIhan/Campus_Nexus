import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <nav className="bg-blue-600 text-white shadow-lg relative z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex space-x-6 items-center">
                        <Link to="/" className="text-xl font-bold tracking-wide">CampusNexus</Link>
                        {user && (
                            <div className="space-x-4">
                                <Link to="/catalog" className="hover:text-blue-200 transition">Catalog</Link>
                                <Link to="/events" className="hover:text-blue-200 transition">Events</Link>
                                <Link to="/cart" className="hover:text-blue-200 transition">Cart</Link>
                                <Link to="/my-rentals" className="hover:text-blue-200 transition">My Rentals</Link>
                                <Link to="/messages" className="hover:text-blue-200 transition">Messages</Link>
                                {user.role === 'Provider' && (
                                    <Link to="/dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-6">
                        {user ? (
                            <>
                                <div className="relative">
                                    <button onClick={() => setShowNotifs(!showNotifs)} className="relative hover:text-blue-200 focus:outline-none">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                        {unreadCount > 0 && (
                                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">{unreadCount}</span>
                                        )}
                                    </button>
                                    
                                    {showNotifs && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-2 text-gray-800 border">
                                            <div className="px-4 py-2 border-b font-bold">Notifications</div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {notifications.length === 0 && <p className="px-4 py-3 text-sm text-gray-500">No notifications.</p>}
                                                {notifications.map(n => (
                                                    <div key={n.id} onClick={() => markAsRead(n.id)} className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b ${!n.is_read ? 'bg-blue-50 font-semibold' : ''}`}>
                                                        <p className="text-sm">{n.message}</p>
                                                        <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-3 border-l border-blue-500 pl-4">
                                    <span className="font-medium">{user.name}</span>
                                    <button onClick={handleLogout} className="bg-blue-700 hover:bg-blue-800 transition px-3 py-1.5 rounded-md text-sm font-medium">Logout</button>
                                </div>
                            </>
                        ) : (
                            <div className="space-x-3">
                                <Link to="/login" className="hover:text-blue-200 transition font-medium">Login</Link>
                                <Link to="/register" className="bg-white text-blue-600 hover:bg-blue-50 transition px-4 py-1.5 rounded-md font-medium shadow-sm">Register</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
