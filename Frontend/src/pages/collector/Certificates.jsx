import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    FileCheck, 
    Search, 
    Plus, 
    Download, 
    Eye, 
    Calendar, 
    Leaf, 
    Award, 
    Building, 
    Filter,
    X,
    Loader2
} from 'lucide-react';
import { useAuthStore } from '../../authStore'; // Adjust path if needed

// --- CONFIGURATION ---
const API_BASE_URL = "http://localhost:8000"; 

const Badge = ({ type }) => {
    const styles = type === 'corporate' 
        ? 'bg-purple-900/50 text-purple-200 border-purple-700' 
        : 'bg-blue-900/50 text-blue-200 border-blue-700';
    
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} capitalize`}>
            {type}
        </span>
    );
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const maxWidth = size === 'lg' ? 'max-w-4xl' : 'max-w-md';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className={`bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`}>
                <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-900/50">
                    <h3 className="text-lg font-bold text-gray-100">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default function Certificates() {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [certificates, setCertificates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    
    // Modal States
    const [selectedCert, setSelectedCert] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [newCertData, setNewCertData] = useState({ orderId: '', type: 'individual' });

    // --- 1. FETCH CERTIFICATES ---
    const fetchCertificates = async () => {
        if (!token) return;
        
        try {
            setLoading(true);
            const res = await axios.get(
                `${API_BASE_URL}/api/collector/certificates?search=${searchQuery}&type_filter=${typeFilter}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCertificates(res.data);
        } catch (err) {
            console.error("Failed to fetch certificates", err);
            if (err.response?.status === 401) alert("Session expired. Please login again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, [searchQuery, typeFilter]);

    // --- 2. ISSUE CERTIFICATE ---
    const handleGenerate = async () => {
        // Parse input "PU-105" -> 105 (int)
        // This removes non-digit characters to get the ID
        const pickupIdRaw = newCertData.orderId.replace(/\D/g, ''); 
        
        if (!pickupIdRaw) {
            alert("Invalid Order ID. Please enter format like 'PU-123'");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                pickup_id: parseInt(pickupIdRaw),
                cert_type: newCertData.type
            };

            await axios.post(
                `${API_BASE_URL}/api/collector/certificates`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Success
            alert("Certificate Issued Successfully!");
            setShowCreate(false);
            setNewCertData({ orderId: '', type: 'individual' });
            fetchCertificates(); // Refresh list

        } catch (err) {
            console.error("Issue failed", err);
            // Show backend error message (e.g., "Already issued" or "Not collected")
            alert(err.response?.data?.detail || "Failed to issue certificate");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate Stats on the fly based on current list
    const totalCarbon = certificates.reduce((acc, curr) => acc + curr.carbonOffset, 0).toFixed(1);
    const totalItems = certificates.reduce((acc, curr) => acc + curr.itemsRecycled, 0);

    return (
        <div className="p-6 space-y-6 bg-gray-900 min-h-screen text-gray-100 font-sans">
            
            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-800">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Award className="text-blue-500" /> Certificates Registry
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manage and issue environmental impact certificates.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-300 transition-colors flex items-center gap-2">
                        <Download size={16} /> Export CSV
                    </button>
                    <button 
                        onClick={() => setShowCreate(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={18} /> Issue Certificate
                    </button>
                </div>
            </div>

            {/* --- Stats Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Issued</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{certificates.length}</h3>
                        </div>
                        <div className="p-2 bg-blue-900/30 rounded-lg">
                            <FileCheck className="text-blue-400 w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Carbon Offset</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {totalCarbon} <span className="text-sm text-gray-500">kg</span>
                            </h3>
                        </div>
                        <div className="p-2 bg-green-900/30 rounded-lg">
                            <Leaf className="text-green-400 w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Items Certified</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {totalItems}
                            </h3>
                        </div>
                        <div className="p-2 bg-purple-900/30 rounded-lg">
                            <Award className="text-purple-400 w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Filters & Search --- */}
            <div className="flex flex-col md:flex-row gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text"
                        placeholder="Search ID, Client or Order..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block pl-10 p-2.5 placeholder-gray-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400 w-4 h-4" />
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                    >
                        <option value="all">All Types</option>
                        <option value="individual">Individual</option>
                        <option value="corporate">Corporate</option>
                    </select>
                </div>
            </div>

            {/* --- Data Table --- */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Cert ID</th>
                                <th className="px-6 py-4 font-semibold">Order Ref</th>
                                <th className="px-6 py-4 font-semibold">Issued To</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Impact</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="animate-spin w-5 h-5 text-blue-500" /> Loading certificates...
                                        </div>
                                    </td>
                                </tr>
                            ) : certificates.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No certificates found matching your search.</td>
                                </tr>
                            ) : (
                                certificates.map((cert) => (
                                    <tr key={cert.id} className="hover:bg-gray-700/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-blue-400 font-medium">{cert.id}</td>
                                        <td className="px-6 py-4 text-gray-400">{cert.orderId}</td>
                                        <td className="px-6 py-4 font-medium text-gray-200">
                                            <div className="flex items-center gap-2">
                                                {cert.type === 'corporate' ? <Building size={14} className="text-purple-400"/> : null}
                                                {cert.customerName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge type={cert.type} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 flex items-center gap-2">
                                            <Calendar size={14}/> {cert.issueDate}
                                        </td>
                                        <td className="px-6 py-4 text-green-400 font-medium">
                                            {cert.carbonOffset.toFixed(1)} kg CO₂
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setSelectedCert(cert); setShowPreview(true); }}
                                                    className="p-1.5 bg-gray-700 hover:bg-blue-600 rounded-md text-gray-300 hover:text-white transition-colors" 
                                                    title="Preview"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    className="p-1.5 bg-gray-700 hover:bg-green-600 rounded-md text-gray-300 hover:text-white transition-colors" 
                                                    title="Download PDF"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- CREATE MODAL --- */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Issue New Certificate">
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">Generate a certificate for a verified pickup. This will calculate the impact automatically based on inventory.</p>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Pickup Order ID</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="e.g. PU-105"
                            value={newCertData.orderId}
                            onChange={(e) => setNewCertData({...newCertData, orderId: e.target.value})}
                        />
                        <p className="text-xs text-gray-500 mt-1">Must be a "COLLECTED" pickup.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Recipient Type</label>
                        <select 
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
                            value={newCertData.type}
                            onChange={(e) => setNewCertData({...newCertData, type: e.target.value})}
                        >
                            <option value="individual">Individual</option>
                            <option value="corporate">Corporate (Tax Benefit)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            onClick={() => setShowCreate(false)}
                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleGenerate}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex justify-center items-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Generate"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* --- PREVIEW MODAL (LIGHT THEMED VISUAL) --- */}
            <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Certificate Preview" size="lg">
                {selectedCert && (
                    <div className="space-y-6">
                        {/* The Actual Certificate (Paper Look) */}
                        <div className="bg-white text-gray-900 p-8 rounded-lg shadow-inner border-8 border-double border-gray-200 relative overflow-hidden">
                            {/* Watermark */}
                            <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-green-500/10" />
                            
                            <div className="relative z-10 text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center">
                                        <Award className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                
                                <div>
                                    <h2 className="text-3xl font-serif font-bold text-blue-900">Certificate of Impact</h2>
                                    <p className="text-gray-500 text-sm uppercase tracking-widest mt-1">e-Drop Recycling Initiative</p>
                                </div>

                                <div className="py-4 border-y border-gray-200 my-6">
                                    <p className="text-gray-600 italic">This certifies that</p>
                                    <h3 className="text-2xl font-bold text-gray-800 my-2">{selectedCert.customerName}</h3>
                                    <p className="text-gray-600 italic">has responsibly recycled e-waste with Order Ref: <span className="font-mono font-bold not-italic">{selectedCert.orderId}</span></p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 text-center max-w-md mx-auto">
                                    <div>
                                        <p className="text-4xl font-bold text-green-600">{selectedCert.carbonOffset.toFixed(1)}</p>
                                        <p className="text-xs uppercase text-gray-500 mt-1">Kg CO₂ Offset</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-bold text-blue-600">{selectedCert.itemsRecycled}</p>
                                        <p className="text-xs uppercase text-gray-500 mt-1">Items Recycled</p>
                                    </div>
                                </div>

                                <div className="pt-8 text-xs text-gray-400 flex justify-between items-end">
                                    <div className="text-left">
                                        <p>Certificate ID: {selectedCert.id}</p>
                                        <p>Issued: {selectedCert.issueDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="h-8 w-32 border-b border-gray-400 mb-1"></div>
                                        <p>Authorized Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                            >
                                Close
                            </button>
                            <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-900/20">
                                <Download size={18} /> Download PDF
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
}