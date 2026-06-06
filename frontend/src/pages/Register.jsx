import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Renter');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(name, email, password, role);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-xl w-1/3">
                <h3 className="text-2xl font-bold text-center text-gray-800">Create an account</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mt-4">
                        <div>
                            <label className="block">Name</label>
                            <input type="text" placeholder="Full Name"
                                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                                value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className="mt-4">
                            <label className="block">Email</label>
                            <input type="email" placeholder="Email"
                                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                                value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="mt-4">
                            <label className="block">Password</label>
                            <input type="password" placeholder="Password"
                                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                                value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <div className="mt-4">
                            <label className="block">Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600">
                                <option value="Renter">Renter/Borrower</option>
                                <option value="Provider">Lender/Provider</option>
                            </select>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        <div className="flex items-baseline justify-between">
                            <button className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900">Register</button>
                            <Link to="/login" className="text-sm text-blue-600 hover:underline">Already have an account?</Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
