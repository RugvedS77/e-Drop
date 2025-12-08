import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  Upload, Laptop, Smartphone, Monitor, Trash2, Plus, 
  MapPin, Calendar, CheckCircle, X, ShoppingCart, AlertCircle, Loader2,
  FileText, Sparkles, Clock, Leaf
} from 'lucide-react';
import { useAuthStore } from '../../authStore'; 

// --- Configuration ---
const API_BASE_URL = "http://localhost:8000"; 

const categoryIcons = {
  laptop: Laptop,
  "cell phone": Smartphone,
  monitor: Monitor,
  tv: Monitor,
  accessories: Trash2,
};

export default function ScanItem() {
  const { token } = useAuthStore();
  
  // --- State ---
  const [step, setStep] = useState('upload'); 
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [lastScannedImageUrl, setLastScannedImageUrl] = useState(null);
  
  // Detection State
  const [detectedItems, setDetectedItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [yearsUsed, setYearsUsed] = useState(1);

  // Cart & Booking State
  const [cart, setCart] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationLoading, setLocationLoading] = useState(false);
  const [dataWipeConfirmed, setDataWipeConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- API Helpers ---
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  // Helper to format error messages safely
  const formatError = (error) => {
    if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) return detail.map(e => e.msg).join(', '); // Pydantic errors
        return JSON.stringify(detail);
    }
    return "An unexpected error occurred.";
  };

  // --- 1. Scan Logic ---
  const handleFile = async (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setUploadedImagePreview(e.target.result);
    reader.readAsDataURL(file);

    setStep('analyzing');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/pickups/scan`, 
        formData, 
        { headers: { ...getAuthHeaders().headers, 'Content-Type': 'multipart/form-data' } }
      );

      const { detected_items, image_url } = response.data;

      if (!detected_items || detected_items.length === 0) {
        alert("No e-waste detected. Please try a clearer image.");
        resetScan();
        return;
      }

      setDetectedItems(detected_items);
      setLastScannedImageUrl(image_url);
      setCurrentItemIndex(0);
      
      const initialCond = detected_items[0].condition.toLowerCase();
      setCondition(initialCond === 'scrap' ? 'scrap' : 'working');
      
      // Reset inputs for new item
      setUserDescription(""); 
      setYearsUsed(1); 
      
      setStep('result');

    } catch (error) {
      console.error("Scan error:", error);
      alert(formatError(error));
      resetScan();
    }
  };

  // --- 2. Cart Logic ---
  const addToCart = () => {
    const currentItem = detectedItems[currentItemIndex];
    let finalValue = currentItem.estimated_value;
    
    if (condition === 'scrap' && currentItem.estimated_value > 0) {
        finalValue = Math.round(currentItem.estimated_value * 0.5);
    }

    const finalItem = {
      ...currentItem,
      detected_condition: condition.toLowerCase(), // Ensure lowercase enum
      description: userDescription, // New Field
      years_used: yearsUsed,        // New Field
      value: finalValue,
      cartId: Date.now(),
      imageUrl: lastScannedImageUrl 
    };

    setCart([...cart, finalItem]);
    resetScan();
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const resetScan = () => {
    setUploadedImagePreview(null);
    setDetectedItems([]);
    setUserDescription("");
    setYearsUsed(1);
    setStep('upload');
  };

  // --- 3. UI Helpers ---
  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleGetLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => { alert("Location access denied"); setLocationLoading(false); }
    );
  };

  // --- 4. Booking Logic ---
  const handleBooking = async () => {
    // 1. Validation
    if (!pickupDate || !pickupTime || !address || !location.lat) {
      alert("Please fill in all details including location and address.");
      return;
    }

    setIsSubmitting(true);

    // Helper: Extract simple timeslot (e.g., "Morning" from "Morning (9 AM - 12 PM)")
    // If your backend expects the FULL string, remove .split(' ')[0]
    const simpleTimeslot = pickupTime.split(' ')[0]; 

    // 2. Construct Payload matching Backend 'PickupCreate' Schema
    const payload = {
      items: cart.map(item => ({
        item_name: item.item,
        detected_condition: item.detected_condition,
        credit_value: item.value,
        description: item.description,
        years_used: item.years_used
      })),
      pickup_date: pickupDate,            
      timeslot: pickupTime,          
      latitude: location.lat,             
      longitude: location.lng,            
      address_text: address,              
      data_wipe_confirmed: dataWipeConfirmed, 
      image_url: cart.length > 0 ? cart[0].imageUrl : null 
    };

    try {
      console.log("Sending Payload:", payload); // Debug: Check console to see what is being sent
      await axios.post(`${API_BASE_URL}/api/pickups/create`, payload, getAuthHeaders());
      alert(`Pickup Scheduled successfully!`);
      
      // Reset State
      setShowScheduleModal(false);
      setCart([]);
      setAddress('');
      setLocation({lat: null, lng: null});
      setPickupDate('');
      setPickupTime('');
      setDataWipeConfirmed(false);
    } catch (error) {
      console.error(error);
      alert(formatError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Stats ---
  const totalCartValue = cart.reduce((sum, item) => sum + item.value, 0);
  const totalCO2 = (cart.length * 2.5).toFixed(1); 
  const currentDetectedItem = detectedItems[currentItemIndex];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen bg-gray-50/50">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recycle E-Waste</h1>
          <p className="text-gray-500 mt-1">Scan items, get a quote, and we'll pick them up.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Interaction Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              className={`
                group relative h-[500px] rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center bg-white shadow-sm hover:shadow-md
                ${dragActive ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:border-green-400'}
              `}
            >
              <input id="file-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              
              <div className="w-24 h-24 bg-green-50 group-hover:bg-green-100 rounded-full flex items-center justify-center mb-6 transition-colors">
                <Upload className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload or Drag Photo</h3>
              <p className="text-gray-400 max-w-xs mx-auto">Take a clear photo of your device. Our AI will identify it instantly.</p>
            </div>
          )}

          {/* STEP 2: Analyzing */}
          {step === 'analyzing' && (
            <div className="h-[500px] rounded-3xl border border-gray-100 bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-lg">
              {uploadedImagePreview && (
                <img src={uploadedImagePreview} alt="Scanning" className="absolute inset-0 w-full h-full object-cover opacity-10 blur-md scale-110" />
              )}
              <div className="relative z-10 text-center bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-gray-800 animate-pulse">Analyzing Image...</h3>
                <p className="text-gray-500 mt-2 text-sm">Identifying device type & condition</p>
              </div>
            </div>
          )}

          {/* STEP 3: Results & Description */}
          {step === 'result' && currentDetectedItem && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="grid md:grid-cols-2 h-full">
                
                {/* Left: Image */}
                <div className="bg-gray-100 relative h-64 md:h-auto min-h-[400px]">
                  <img src={uploadedImagePreview} alt="Item" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                    <div className="inline-flex items-center gap-2 bg-green-500/90 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-bold w-fit mb-2 shadow-lg">
                        <Sparkles size={14} /> AI Detected
                    </div>
                    <h2 className="text-3xl font-bold text-white capitalize">{currentDetectedItem.item}</h2>
                    <p className="text-gray-200 font-medium text-sm mt-1">
                      Confidence: {(currentDetectedItem.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Right: Form */}
                <div className="p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
                  <div className="space-y-6 flex-1">
                    
                    {/* Condition Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Device Condition</label>
                        <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setCondition('scrap')}
                            className={`p-4 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-2 ${condition === 'scrap' ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-500/20' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Trash2 size={20}/> Dead / Scrap
                        </button>
                        <button
                            onClick={() => setCondition('working')}
                            className={`p-4 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-2 ${condition === 'working' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/20' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            <CheckCircle size={20}/> Working / Good
                        </button>
                        </div>
                    </div>

                    {/* Years Used Slider */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Clock size={16} className="text-gray-400"/> Years Used
                        </label>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-600">Duration</span>
                                <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-md">
                                    {yearsUsed} {yearsUsed === 1 ? 'Year' : 'Years'}
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                step="1"
                                value={yearsUsed}
                                onChange={(e) => setYearsUsed(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                <span>New</span>
                                <span>5 Years</span>
                                <span>10+ Years</span>
                            </div>
                        </div>
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <FileText size={16} className="text-gray-400"/> Description <span className="text-xs font-normal text-gray-400">(Optional)</span>
                        </label>
                        <textarea 
                            value={userDescription}
                            onChange={(e) => setUserDescription(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none resize-none text-sm text-gray-700 placeholder-gray-400"
                            rows="2"
                            placeholder="Add details (e.g. Screen cracked, Missing charger...)"
                        />
                    </div>

                    {/* Price Display */}
                    <div className="bg-gray-900 rounded-xl p-5 text-white flex justify-between items-center shadow-lg">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Estimated Value</p>
                            <p className="text-sm text-gray-400">Based on market rates</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-green-400">
                                {condition === 'scrap' ? Math.round(currentDetectedItem.estimated_value * 0.5) : currentDetectedItem.estimated_value}
                            </p>
                            <p className="text-xs text-green-400 font-medium">Credits</p>
                        </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button onClick={addToCart} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 transform active:scale-95">
                      <Plus className="w-5 h-5" /> Add to Cart
                    </button>
                    <button onClick={resetScan} className="px-5 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Cart & Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" /> Your Cart
              </h3>
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">{cart.length} Items</span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">Cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">Scan items to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {cart.map((item) => {
                      const Icon = categoryIcons[item.item.toLowerCase()] || Laptop;
                      return (
                      <div key={item.cartId} className="flex flex-col p-3 bg-gray-50 rounded-xl group relative border border-transparent hover:border-gray-200 transition-all">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-500">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-bold text-gray-800 capitalize">{item.item}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="capitalize">{item.detected_condition}</span>
                                    <span>•</span>
                                    <span>{item.years_used}y old</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-green-600">{item.value}</p>
                            </div>
                            <button onClick={() => removeFromCart(item.cartId)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        {item.description && (
                            <div className="mt-2 pt-2 border-t border-gray-200/50">
                                <p className="text-xs text-gray-500 italic truncate">"{item.description}"</p>
                            </div>
                        )}
                      </div>
                      )
                  })}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Credits</span>
                    <span className="font-bold text-gray-900 text-lg">{totalCartValue}</span>
                  </div>
                  <div className="flex justify-between text-xs bg-green-50 p-2 rounded-lg text-green-700">
                    <span className="flex items-center gap-1"><Leaf className="w-3 h-3"/> Carbon Impact</span>
                    <span className="font-bold">~{totalCO2} kg saved</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
                >
                  <Calendar className="w-5 h-5" /> Schedule Pickup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Schedule Modal --- */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
            <button onClick={() => setShowScheduleModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm Pickup</h2>
            <p className="text-gray-500 mb-6">Complete details for our collector.</p>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date</label>
                    <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" 
                    onChange={(e) => setPickupDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Time Slot</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    onChange={(e) => setPickupTime(e.target.value)}
                    >
                    <option value="">Select Time</option>
                    <option>Morning (9 AM - 12 PM)</option>
                    <option>Afternoon (12 PM - 4 PM)</option>
                    <option>Evening (4 PM - 8 PM)</option>
                    </select>
                </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Location</label>
                 <div className="flex gap-2">
                    <button 
                        onClick={handleGetLocation}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold hover:bg-blue-100 transition-colors text-sm"
                    >
                        {locationLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapPin className="w-4 h-4"/>}
                        {location.lat ? "Location Set" : "Get Current Location"}
                    </button>
                 </div>
                 {location.lat && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={10}/> Coordinates captured</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Address</label>
                <textarea 
                    rows="2"
                    placeholder="Building name, Street, Landmark..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-start">
                 <input 
                    type="checkbox" 
                    id="wipe-confirm"
                    className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                    checked={dataWipeConfirmed}
                    onChange={(e) => setDataWipeConfirmed(e.target.checked)}
                 />
                 <label htmlFor="wipe-confirm" className="text-sm text-amber-900 cursor-pointer leading-tight">
                    <strong>Data Wipe Confirmation:</strong> I confirm I have wiped all personal data. EcoCycle is not responsible for data loss.
                 </label>
              </div>

              <button 
                disabled={isSubmitting}
                onClick={handleBooking}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : "Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}