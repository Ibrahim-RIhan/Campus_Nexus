import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/events');
            setEvents(res.data);
        } catch (err) {
            console.error('Error fetching events', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/events', { title, date }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEvents();
            setTitle(''); setDate('');
        } catch (err) {
            console.error('Error creating event', err);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Campus Events</h1>
            
            {user?.role === 'Admin' && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold mb-4">Add Event</h2>
                    <form onSubmit={handleSubmit} className="flex gap-4">
                        <input type="text" placeholder="Event Title" value={title} onChange={e => setTitle(e.target.value)} required className="border p-2 rounded flex-1" />
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="border p-2 rounded" />
                        <button type="submit" className="bg-blue-600 text-white rounded px-6 py-2 hover:bg-blue-700">Add</button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {events.map(ev => (
                        <li key={ev.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{ev.title}</h3>
                                <p className="text-gray-500 text-sm">Date: {new Date(ev.date).toLocaleDateString()}</p>
                            </div>
                            {ev.is_verified ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">Verified</span>
                            ) : (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">Pending</span>
                            )}
                        </li>
                    ))}
                    {events.length === 0 && <p className="text-gray-500 text-center py-6">No events scheduled.</p>}
                </ul>
            </div>
        </div>
    );
};

export default Events;
