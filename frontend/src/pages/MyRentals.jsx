import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../contexts/AuthContext';

const MyRentals = () => {
    const [rentals, setRentals] = useState([]);
    const { user } = useContext(AuthContext);
    
    // Review Modal State
    const [showReview, setShowReview] = useState(false);
    const [reviewRentalId, setReviewRentalId] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    // QR Code Modal State
    const [showQrCode, setShowQrCode] = useState(false);
    const [qrValue, setQrValue] = useState('');
    const [qrTitle, setQrTitle] = useState('');

    // Scan Modal State
    const [showScanner, setShowScanner] = useState(false);
    const [scanRentalId, setScanRentalId] = useState('');
    const [scanTargetStatus, setScanTargetStatus] = useState('');
    const [manualCode, setManualCode] = useState('');

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

    const updateStatus = async (id, newStatus, secret = null) => {
        try {
            const token = localStorage.getItem('token');
            const payload = { status: newStatus };
            if (secret) payload.qrSecret = secret;

            await axios.patch(`http://localhost:5000/api/rentals/${id}/status`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowScanner(false);
            setManualCode('');
            fetchRentals();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleSimulateScan = (e) => {
        e.preventDefault();
        updateStatus(scanRentalId, scanTargetStatus, manualCode);
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/reviews', {
                rentalId: reviewRentalId,
                rating,
                comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowReview(false);
            setRating(5);
            setComment('');
            alert('Review submitted successfully!');
            fetchRentals();
        } catch (err) {
            alert('Failed to submit review');
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {r.status === 'APPROVED' && (
                                        <button 
                                            onClick={() => { setQrValue(r.qrSecret); setQrTitle("Show this to Provider to Activate"); setShowQrCode(true); }} 
                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition"
                                        >
                                            Show Activation QR
                                        </button>
                                    )}
                                    {r.status === 'ACTIVE' && (
                                        <button 
                                            onClick={() => { setScanRentalId(r.id); setScanTargetStatus('RETURNED'); setShowScanner(true); }} 
                                            className="text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded transition"
                                        >
                                            Scan Return QR
                                        </button>
                                    )}
                                    {r.status === 'RETURNED' && (
                                        <button onClick={() => updateStatus(r.id, 'COMPLETED')} className="text-white bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded transition">Complete</button>
                                    )}
                                    {r.status === 'COMPLETED' && (
                                        <button onClick={() => { setShowReview(true); setReviewRentalId(r.id); }} className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 px-3 py-1 rounded transition">Leave Review</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {rentals.length === 0 && (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No rentals found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Review Modal */}
            {showReview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-xl font-bold mb-4">Leave a Review</h2>
                        <form onSubmit={submitReview}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                                <input type="number" min="1" max="5" value={rating} onChange={e => setRating(e.target.value)} required className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                                <textarea value={comment} onChange={e => setComment(e.target.value)} required rows="3" className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"></textarea>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowReview(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Submit Review</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Display Modal */}
            {showQrCode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <h2 className="text-xl font-bold mb-4">{qrTitle}</h2>
                        <div className="flex justify-center mb-4">
                            <QRCodeSVG value={qrValue} size={200} />
                        </div>
                        <p className="text-xs text-gray-500 mb-6">Secret Code: {qrValue}</p>
                        <button onClick={() => setShowQrCode(false)} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Close</button>
                    </div>
                </div>
            )}

            {/* Scanner / Manual Code Entry Modal */}
            {showScanner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-xl font-bold mb-4">Verify Handoff</h2>
                        <p className="text-gray-600 text-sm mb-4">In a real app, the camera would open here. For this demo, enter the secret code displayed on the other user's screen.</p>
                        <form onSubmit={handleSimulateScan}>
                            <input 
                                type="text" 
                                value={manualCode} 
                                onChange={e => setManualCode(e.target.value)} 
                                placeholder="Enter secret code..." 
                                required 
                                className="w-full border p-2 rounded mb-4"
                            />
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowScanner(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Submit Code</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyRentals;
