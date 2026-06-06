import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';

const Messages = () => {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const initialContactId = searchParams.get('user');
    const initialContactName = searchParams.get('name');

    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    const socketRef = useRef();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        // Initialize Socket.io
        socketRef.current = io('http://localhost:5000');
        socketRef.current.emit('join', user.id);

        socketRef.current.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        fetchContacts();

        return () => {
            socketRef.current.disconnect();
        };
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (initialContactId && initialContactName) {
            setActiveContact({ id: initialContactId, name: initialContactName });
            fetchMessages(initialContactId);
        }
    }, [initialContactId, initialContactName]);

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/messages/users/contacts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContacts(res.data);
            
            // If no initial contact from URL and contacts exist, select the first one
            if (!initialContactId && res.data.length > 0) {
                setActiveContact(res.data[0]);
                fetchMessages(res.data[0].id);
            }
        } catch (err) {
            console.error('Error fetching contacts', err);
        }
    };

    const fetchMessages = async (contactId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/messages/${contactId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (err) {
            console.error('Error fetching messages', err);
        }
    };

    const handleSelectContact = (contact) => {
        setActiveContact(contact);
        fetchMessages(contact.id);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact) return;

        const msgData = {
            senderId: user.id,
            receiverId: activeContact.id,
            content: newMessage
        };

        socketRef.current.emit('send_message', msgData);
        setNewMessage('');
    };

    if (!user) return <div className="p-8 text-center text-gray-500">Please login to view messages.</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-80px)]">
            <div className="bg-white rounded-xl shadow-lg border h-full flex overflow-hidden">
                
                {/* Contacts Sidebar */}
                <div className="w-1/3 border-r bg-gray-50 flex flex-col">
                    <div className="p-4 border-b bg-white">
                        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {contacts.length === 0 && !initialContactId && (
                            <p className="p-4 text-gray-500 text-sm text-center mt-4">No recent contacts.</p>
                        )}
                        
                        {/* Always show the initial contact from URL if it's not in the contacts list yet */}
                        {initialContactId && !contacts.find(c => c.id === initialContactId) && (
                            <div 
                                onClick={() => handleSelectContact({ id: initialContactId, name: initialContactName })}
                                className={`p-4 border-b cursor-pointer transition ${activeContact?.id === initialContactId ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}
                            >
                                <div className="font-semibold text-gray-800">{initialContactName}</div>
                                <div className="text-xs text-gray-500">New Conversation</div>
                            </div>
                        )}

                        {contacts.map(contact => (
                            <div 
                                key={contact.id} 
                                onClick={() => handleSelectContact(contact)}
                                className={`p-4 border-b cursor-pointer transition ${activeContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-100 border-l-4 border-l-transparent'}`}
                            >
                                <div className="font-semibold text-gray-800">{contact.name}</div>
                                <div className="text-xs text-gray-500 capitalize">{contact.role}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Window */}
                <div className="w-2/3 flex flex-col bg-white">
                    {activeContact ? (
                        <>
                            <div className="p-4 border-b bg-white shadow-sm z-10 flex items-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                                    {activeContact.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">{activeContact.name}</h3>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${msg.senderId === user.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.senderId === user.id ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-white border-t">
                                <form onSubmit={sendMessage} className="flex space-x-2">
                                    <input 
                                        type="text" 
                                        value={newMessage} 
                                        onChange={e => setNewMessage(e.target.value)} 
                                        placeholder="Type a message..." 
                                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!newMessage.trim()} 
                                        className="bg-blue-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition"
                                    >
                                        <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                            <p className="text-lg">Select a conversation or start a new one</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
