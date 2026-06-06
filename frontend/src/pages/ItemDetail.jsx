import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/items/${id}`);
                setItem(res.data);
            } catch (err) {
                setError('Failed to fetch item details.');
            }
        };
        fetchItem();
    }, [id]);

    const handleRequest = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!startDate || !endDate) return setError('Please select both start and end dates.');
        if (new Date(startDate) > new Date(endDate)) return setError('End date must be after start date.');

        const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) || 1;
        const totalCost = (days * item.price) + parseFloat(item.deposit);

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/rentals/request', {
                itemId: item.id,
                startDate,
                endDate,
                totalCost
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Rental request sent to provider! Awaiting approval.');
            setTimeout(() => navigate('/my-rentals'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request rental.');
        }
    };

    if (!item) return <div className="p-8">Loading...</div>;

    const days = (startDate && endDate) ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) || 1 : 0;
    const totalCost = days ? (days * item.price) + parseFloat(item.deposit) : 0;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 bg-gray-200 min-h-[300px] flex items-center justify-center">
                    <span className="text-gray-500 font-medium">No Image Provided</span>
                </div>
                <div className="w-full md:w-1/2 p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{item.title}</h1>
                    <p className="text-gray-500 mb-6">{item.category} • Condition: {item.condition}</p>
                    
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Price per day</span>
                            <span className="font-semibold text-gray-800">${item.price}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Security Deposit</span>
                            <span className="font-semibold text-gray-800">${item.deposit}</span>
                        </div>
                    </div>

                    <h3 className="font-bold text-lg mb-4 text-gray-800">Check Availability & Request</h3>
                    <form onSubmit={handleRequest} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full border p-2 rounded" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full border p-2 rounded" />
                            </div>
                        </div>

                        {days > 0 && (
                            <div className="border-t pt-4 mt-4">
                                <div className="flex justify-between font-bold text-lg text-gray-800">
                                    <span>Total Cost (w/ deposit)</span>
                                    <span>${totalCost.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
                        {success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</p>}

                        <button type="submit" disabled={!startDate || !endDate} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                            Request Rental
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
