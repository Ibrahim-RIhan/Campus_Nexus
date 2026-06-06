import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const MyRentals = () => {
    const [rentals, setRentals] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchRentals();
    }, []);

    const fetchRentals = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/rentals/my-rentals', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRentals(res.data);
        } catch (err) {
            console.error('Error fetching rentals', err);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5000/api/rentals/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRentals();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (user?.role !== 'Renter' && user?.role !== 'Provider') return <div className="p-8">Please login.</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">My Rentals</h1>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rentals.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.itemTitle}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">${r.totalCost}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${r.status === 'REQUESTED' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        ${r.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : ''}
                                        ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                                        ${r.status === 'RETURNED' ? 'bg-purple-100 text-purple-800' : ''}
                                        ${r.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                                        ${r.status === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
                                    `}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {r.status === 'APPROVED' && (
                                        <button onClick={() => updateStatus(r.id, 'ACTIVE')} className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">Pay & Start Rental</button>
                                    )}
                                    {r.status === 'RETURNED' && (
                                        <button onClick={() => updateStatus(r.id, 'COMPLETED')} className="text-white bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded">Acknowledge Completion</button>
                                    )}
                                    {r.status !== 'APPROVED' && r.status !== 'RETURNED' && <span className="text-gray-400">No action</span>}
                                </td>
                            </tr>
                        ))}
                        {rentals.length === 0 && (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No rentals found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyRentals;
