import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Catalog = () => {
    const [items, setItems] = useState([]);
    const [trustScores, setTrustScores] = useState({});
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCatalog();
    }, [search]);

    const fetchCatalog = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/items?search=${search}`);
            setItems(res.data);
            
            // Fetch trust scores for unique owners
            const ownerIds = [...new Set(res.data.map(item => item.ownerId))];
            ownerIds.forEach(id => {
                if (id && !trustScores[id]) {
                    axios.get(`http://localhost:5000/api/users/${id}/trust-score`)
                        .then(scoreRes => {
                            setTrustScores(prev => ({ ...prev, [id]: scoreRes.data }));
                        })
                        .catch(err => console.error("Error fetching trust score", err));
                }
            });

        } catch (err) {
            console.error('Error fetching catalog', err);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Campus Catalog</h1>
                <input 
                    type="text" 
                    placeholder="Search items..." 
                    className="border p-2 rounded-lg w-64 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {items.map(item => (
                    <div key={item.id} className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition duration-200">
                        <div className="h-40 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 font-medium">No Image</span>
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-xl text-gray-800">{item.title}</h3>
                            <p className="text-gray-500 text-sm mb-2">{item.category}</p>
                            
                            {trustScores[item.ownerId] && trustScores[item.ownerId].badge && (
                                <div className="mb-2">
                                    <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded shadow-sm border border-yellow-200">
                                        {trustScores[item.ownerId].badge}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center mt-4">
                                <div>
                                    <p className="text-blue-600 font-bold text-lg">${item.price}<span className="text-sm text-gray-500 font-normal">/day</span></p>
                                </div>
                                <Link to={`/items/${item.id}`} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition">View Details</Link>
                            </div>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-gray-500 col-span-3 text-center py-12">No available items found.</p>}
            </div>
        </div>
    );
};

export default Catalog;
