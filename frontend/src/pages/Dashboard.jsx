import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../contexts/AuthContext';

const Dashboard = () => {
    const [items, setItems] = useState([]);
    const [requests, setRequests] = useState([]);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [deposit, setDeposit] = useState('');
    const [condition, setCondition] = useState('Good');
    const { user } = useContext(AuthContext);

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
        if (user?.role === 'Provider') {
            fetchItems();
            fetchRequests();
        }
    }, [user]);

    const fetchItems = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/items/my-items', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(res.data);
        } catch (err) {
            console.error('Error fetching items', err);
        }
    };

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/rentals/incoming', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data);
        } catch (err) {
            console.error('Error fetching requests', err);
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
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleSimulateScan = (e) => {
        e.preventDefault();
        updateStatus(scanRentalId, scanTargetStatus, manualCode);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/items', {
                title, category, price, deposit, condition
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchItems();
            setTitle(''); setCategory(''); setPrice(''); setDeposit('');
        } catch (err) {
            console.error('Error posting item', err);
        }
    };

    if (user?.role !== 'Provider') return <div className="p-8">Access Denied. Providers only.</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Provider Dashboard</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4">Post a New Item</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required className="border p-2 rounded" />
                    <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} required className="border p-2 rounded" />
                    <input type="number" placeholder="Price / Day" value={price} onChange={e => setPrice(e.target.value)} required className="border p-2 rounded" />
                    <input type="number" placeholder="Security Deposit" value={deposit} onChange={e => setDeposit(e.target.value)} required className="border p-2 rounded" />
                    <select value={condition} onChange={e => setCondition(e.target.value)} className="border p-2 rounded">
                        <option value="New">New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                    </select>
                    <button type="submit" className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 col-span-2">Post Listing</button>
                </form>
            </div>

            <h2 className="text-2xl font-bold mb-4 text-gray-800">My Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {items.map(item => (
                    <div key={item.id} className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition">
                        <h3 className="font-bold text-lg">{item.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{item.category} • {item.condition}</p>
                        <p className="text-blue-600 font-semibold">${item.price}/day</p>
                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.status}
                        </span>
                    </div>
                ))}
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-gray-800">Incoming Rental Requests</h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.map(r => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.itemTitle}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.renterName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                                </td>
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
                                    {r.status === 'REQUESTED' && (
                                        <>
                                            <button onClick={() => updateStatus(r.id, 'APPROVED')} className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded">Approve</button>
                                            <button onClick={() => updateStatus(r.id, 'REJECTED')} className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded">Reject</button>
                                        </>
                                    )}
                                    {r.status === 'APPROVED' && (
                                        <button 
                                            onClick={() => { setScanRentalId(r.id); setScanTargetStatus('ACTIVE'); setShowScanner(true); }} 
                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition"
                                        >
                                            Scan Activation QR
                                        </button>
                                    )}
                                    {r.status === 'ACTIVE' && (
                                        <button 
                                            onClick={() => { setQrValue(r.returnQrSecret); setQrTitle("Show this to Renter to Return"); setShowQrCode(true); }} 
                                            className="text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded transition"
                                        >
                                            Show Return QR
                                        </button>
                                    )}
                                    {r.status === 'RETURNED' && (
                                        <button onClick={() => updateStatus(r.id, 'COMPLETED')} className="text-white bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded">Complete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No incoming requests.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

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

export default Dashboard;
