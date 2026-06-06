import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCartItems(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const removeFromCart = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/cart/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCart();
        } catch (err) {
            alert('Failed to remove item');
        }
    };

    const checkout = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/cart/checkout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Checkout successful! Rental requests have been sent to providers.');
            navigate('/my-rentals');
        } catch (err) {
            alert(err.response?.data?.message || 'Checkout failed');
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-500">Please login to view cart.</div>;
    if (loading) return <div className="p-8 text-center">Loading cart...</div>;

    const totalCheckoutAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.totalCost), 0);

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Cart</h1>
            
            {cartItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-4">Your cart is empty.</p>
                    <button onClick={() => navigate('/catalog')} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
                        Browse Catalog
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cartItems.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-gray-800">{item.title}</div>
                                        <div className="text-xs text-gray-500">Provider: {item.ownerName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(item.startDate).toLocaleDateString()} to {new Date(item.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                                        ${parseFloat(item.totalCost).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => removeFromCart(item.id)} className="text-red-600 hover:text-red-900 font-bold">Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="p-6 bg-gray-50 flex justify-between items-center border-t">
                        <div className="text-xl font-bold text-gray-800">
                            Total: ${totalCheckoutAmount.toFixed(2)}
                        </div>
                        <button onClick={checkout} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition shadow-sm">
                            Checkout & Request Rentals
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
