import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Calendar from 'react-calendar';
import 'leaflet/dist/leaflet.css';
import 'react-calendar/dist/Calendar.css';
import { AuthContext } from '../contexts/AuthContext';

const ItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [item, setItem] = useState(null);
    const [trustScore, setTrustScore] = useState(null);
    const [bookedDates, setBookedDates] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reportReason, setReportReason] = useState('');
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/items/${id}`);
                setItem(res.data);
                fetchTrustScore(res.data.ownerId);
            } catch (err) {
                setError('Failed to fetch item details.');
            }
        };

        const fetchTrustScore = async (ownerId) => {
            try {
                const res = await axios.get(`http://localhost:5000/api/users/${ownerId}/trust-score`);
                setTrustScore(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        const fetchBookedDates = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/rentals/item/${id}/booked-dates`);
                setBookedDates(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchItem();
        fetchBookedDates();
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
            await axios.post('http://localhost:5000/api/cart', {
                itemId: id,
                startDate,
                endDate,
                totalCost
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Added to cart successfully!');
            setTimeout(() => {
                navigate('/cart');
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add to cart');
        }
    };

    const handleReport = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/moderation/report', {
                reportedItemId: id,
                reportedUserId: item.ownerId,
                reason: reportReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowReport(false);
            alert("Listing has been reported and sent to moderation.");
        } catch (err) {
            alert('Failed to report listing');
        }
    };

    const isDateDisabled = ({ date }) => {
        // Disable past dates
        if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;

        // Check if date falls within any booked range
        return bookedDates.some(range => {
            const start = new Date(range.startDate);
            const end = new Date(range.endDate);
            return date >= start && date <= end;
        });
    };

    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!item) return <div className="p-8 text-center">Loading...</div>;

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
                    <p className="text-gray-500 mb-4">{item.category} • Condition: {item.condition}</p>
                    
                    {trustScore && (
                        <div className="mb-6 flex items-center bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                            <div className="flex-1">
                                <p className="text-sm text-yellow-800 font-semibold">Provider: {item.ownerName}</p>
                                <p className="text-xs text-yellow-600">Trust Score: {trustScore.score}/100 • ★ {trustScore.avgRating} ({trustScore.reviewCount} reviews)</p>
                            </div>
                            {trustScore.badge && (
                                <span className="text-sm font-bold bg-white px-3 py-1 rounded-full shadow-sm border border-yellow-200">{trustScore.badge}</span>
                            )}
                        </div>
                    )}
                    
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Price per day</span>
                            <span className="font-semibold text-gray-800">${item.price}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                            <span className="text-gray-600">Security Deposit</span>
                            <span className="font-semibold text-gray-800">${item.deposit}</span>
                        </div>
                        
                        {user && user.id !== item.ownerId && (
                            <Link 
                                to={`/messages?user=${item.ownerId}&name=${encodeURIComponent(item.ownerName)}`} 
                                className="block w-full text-center bg-white border border-blue-600 text-blue-600 font-semibold py-2 rounded hover:bg-blue-50 transition"
                            >
                                💬 Message Provider ({item.ownerName})
                            </Link>
                        )}
                    </div>

                    <button onClick={() => setShowReport(true)} className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center mb-6">
                        🚩 Report Listing
                    </button>

                    {showReport && (
                        <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-200">
                            <h4 className="font-bold text-red-800 mb-2">Report this listing</h4>
                            <form onSubmit={handleReport}>
                                <textarea required placeholder="Reason for reporting..." value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full border p-2 rounded mb-2 text-sm" />
                                <div className="flex justify-end space-x-2">
                                    <button type="button" onClick={() => setShowReport(false)} className="text-gray-500 text-sm">Cancel</button>
                                    <button type="submit" className="bg-red-600 text-white px-4 py-1 rounded text-sm hover:bg-red-700">Submit Report</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <h3 className="font-bold text-lg mb-4 text-gray-800">Check Availability & Request</h3>
                    
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">Availability Calendar (Red = Booked)</p>
                        <Calendar 
                            tileDisabled={isDateDisabled} 
                            className="border-gray-200 rounded-lg shadow-sm w-full"
                        />
                    </div>

                    <form onSubmit={handleRequest} className="space-y-4 mb-8">
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
                            Add to Cart
                        </button>
                    </form>

                    {item.latitude && item.longitude && (
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-gray-800">Pickup Location</h3>
                            <div className="h-48 w-full rounded-lg overflow-hidden border">
                                <MapContainer center={[item.latitude, item.longitude]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[item.latitude, item.longitude]}>
                                        <Popup>Approximate pickup location.</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
