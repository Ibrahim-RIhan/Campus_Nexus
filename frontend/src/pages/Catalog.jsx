import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Catalog = () => {
    const [items, setItems] = useState([]);
    const [trustScores, setTrustScores] = useState({});
    
    // Filters
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [condition, setCondition] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchCatalog();
    }, [search, category, minPrice, maxPrice, condition, sortBy]);

    const fetchCatalog = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (category) params.append('category', category);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);
            if (condition) params.append('condition', condition);
            if (sortBy) params.append('sortBy', sortBy);

            const res = await axios.get(`http://localhost:5000/api/items?${params.toString()}`);
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
        <div className="p-8 max-w-7xl mx-auto flex gap-8">
            {/* Sidebar */}
            <div className="w-1/4 bg-white p-6 rounded-xl shadow-sm border self-start">
                <h2 className="font-bold text-lg mb-4 text-gray-800">Filters</h2>
                
                <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1">Search Keyword</label>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="w-full border p-2 rounded" placeholder="Search..." />
                </div>

                <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2 rounded">
                        <option value="">All Categories</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Books">Books</option>
                        <option value="Skills">Skills/Services</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1">Condition</label>
                    <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full border p-2 rounded">
                        <option value="">Any Condition</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                    </select>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Min Price</label>
                        <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full border p-2 rounded" placeholder="$0" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Max Price</label>
                        <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full border p-2 rounded" placeholder="$Max" />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-gray-600 mb-1">Sort By</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full border p-2 rounded">
                        <option value="newest">Newest First</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                    </select>
                </div>
                
                <button onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setCondition(''); setSortBy('newest'); }} className="w-full bg-gray-100 text-gray-600 p-2 rounded hover:bg-gray-200">
                    Clear Filters
                </button>
            </div>

            {/* Main Content */}
            <div className="w-3/4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Campus Catalog</h1>
                    <span className="text-gray-500">{items.length} items found</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
    );
};

export default Catalog;
