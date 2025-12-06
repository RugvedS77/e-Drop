import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { 
  Upload, Laptop, Smartphone, Monitor, Trash2, Plus, 
  MapPin, Calendar, CheckCircle, X, ShoppingCart, AlertCircle, Loader2
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
  const { user, token } = useAuthStore();
  
  // --- State Management ---
  const [step, setStep] = useState('upload'); // 'upload' | 'analyzing' | 'result'
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [lastScannedImageUrl, setLastScannedImageUrl] = useState(null);
  
  // Detection State
  const [detectedItems, setDetectedItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [condition, setCondition] = useState('working');
  
  // Cart State
  const [cart, setCart] = useState([]);
  
  // Scheduling State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  
  // Location & Address State
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationLoading, setLocationLoading] = useState(false);
  const [dataWipeConfirmed, setDataWipeConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- API Helpers ---
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  // --- 1. Handle File Upload & AI Scan ---
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
        {
          headers: { 
            ...getAuthHeaders().headers,
            'Content-Type': 'multipart/form-data' 
          }
        }
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
      
      setStep('result');

    } catch (error) {
      console.error("Scan error:", error);
      alert(error.response?.data?.detail || "Error scanning image");
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
      detected_condition: condition.toUpperCase(),
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
    setStep('upload');
  };

  // --- 3. Drag & Drop ---
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  // --- 4. Location Handler ---
  const handleGetLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        alert("Unable to retrieve your location");
        setLocationLoading(false);
      }
    );
  };

  // --- 5. Submit Booking (CORRECTED) ---
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
        // FIX: Ensure condition is lowercase to match typical Python Enums
        detected_condition: item.detected_condition.toLowerCase(), 
        credit_value: item.value
      })),
      pickup_date: pickupDate,            
      timeslot: simpleTimeslot,          // FIX: Sending "Morning" instead of full string
      latitude: location.lat,             
      longitude: location.lng,            
      address_text: address,              
      data_wipe_confirmed: dataWipeConfirmed, 
      // FIX: Send null if no image, empty string "" often fails URL validation
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
      console.error("Full Error Object:", error);
      // This will print the specific field that failed validation
      if (error.response?.data?.detail) {
        console.error("Validation Error Details:", error.response.data.detail);
        alert(`Validation Error: ${JSON.stringify(error.response.data.detail)}`);
      } else {
        alert("Failed to schedule pickup. Check console for details.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Derived Stats ---
  const totalCartValue = cart.reduce((sum, item) => sum + item.value, 0);
  const totalCO2 = (cart.length * 2.5).toFixed(1); 
  const currentDetectedItem = detectedItems[currentItemIndex];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Recycle E-Waste</h1>
        <p className="text-gray-500">Scan items, get a price, and schedule a pickup.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Upload & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: Upload Area */}
          {step === 'upload' && (
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              className={`
                relative h-96 rounded-3xl border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center
                ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-400 hover:bg-gray-50'}
              `}
            >
              <input id="file-input" type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">Click or Drag Image Here</h3>
              <p className="text-gray-400 max-w-xs mx-auto">Upload a photo of your electronic device to instantly get a quote.</p>
            </div>
          )}

          {/* STEP 2: Analyzing Animation */}
          {step === 'analyzing' && (
            <div className="h-96 rounded-3xl border-2 border-gray-100 bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
              {uploadedImagePreview && (
                <img src={uploadedImagePreview} alt="Scanning" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm" />
              )}
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold text-gray-800 animate-pulse">AI is Thinking...</h3>
                <p className="text-gray-500 mt-2">Uploading & Detecting objects</p>
              </div>
            </div>
          )}

          {/* STEP 3: Results & Condition Selection */}
          {step === 'result' && currentDetectedItem && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 grid md:grid-cols-2 gap-8">
                
                {/* Image Preview */}
                <div className="rounded-2xl overflow-hidden bg-gray-100 h-64 flex items-center justify-center relative">
                  <img src={uploadedImagePreview} alt="Item" className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-green-700 uppercase tracking-wide">
                    {currentDetectedItem.confidence > 0.8 ? 'High Confidence' : 'Detected'}
                  </div>
                </div>

                {/* Details Form */}
                <div className="flex flex-col justify-center space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 capitalize">{currentDetectedItem.item}</h2>
                    <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Confidence: {(currentDetectedItem.confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  {/* Condition Selector */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Select Condition:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setCondition('scrap')}
                        className={`p-3 rounded-lg text-sm font-medium border-2 transition-all ${condition === 'scrap' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-transparent bg-white text-gray-500 hover:bg-gray-100'}`}
                      >
                        Dead / Scrap
                      </button>
                      <button
                        onClick={() => setCondition('working')}
                        className={`p-3 rounded-lg text-sm font-medium border-2 transition-all ${condition === 'working' ? 'border-green-500 bg-green-50 text-green-700' : 'border-transparent bg-white text-gray-500 hover:bg-gray-100'}`}
                      >
                        Working / Good
                      </button>
                    </div>
                  </div>

                  {/* Price Calculation */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Estimated Value</p>
                      <p className="text-4xl font-extrabold text-green-600">
                         {condition === 'scrap' ? Math.round(currentDetectedItem.estimated_value * 0.5) : currentDetectedItem.estimated_value}
                         <span className="text-lg text-gray-400 font-medium"> Credits</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button onClick={addToCart} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" /> Add to Cart
                    </button>
                    <button onClick={resetScan} className="px-4 py-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all">
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
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Your Cart
              </h3>
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{cart.length} Items</span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 font-medium">Cart is empty</p>
                <p className="text-xs text-gray-400">Scan an item to start</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {cart.map((item) => {
                     const Icon = categoryIcons[item.item.toLowerCase()] || Laptop;
                     return (
                      <div key={item.cartId} className="flex items-center p-3 bg-gray-50 rounded-xl group relative">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-500">
                           <Icon className="w-5 h-5" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-bold text-gray-800 capitalize">{item.item}</p>
                          <p className="text-xs text-gray-500 capitalize">{item.detected_condition} Cond.</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">{item.value}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.cartId)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                     )
                  })}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Credits</span>
                    <span className="font-bold text-gray-900">{totalCartValue}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Carbon Offset</span>
                    <span className="font-bold text-green-600">~{totalCO2} kg</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowScheduleModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm Pickup</h2>
            <p className="text-gray-500 mb-6">Complete details for our collector.</p>

            <div className="space-y-4">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                    onChange={(e) => setPickupDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time Slot</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                    onChange={(e) => setPickupTime(e.target.value)}
                    >
                    <option value="">Select Time</option>
                    <option>Morning (9 AM - 12 PM)</option>
                    <option>Afternoon (12 PM - 4 PM)</option>
                    <option>Evening (4 PM - 8 PM)</option>
                    </select>
                </div>
              </div>

              {/* Location */}
              <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Location</label>
                 <div className="flex gap-2">
                    <button 
                        onClick={handleGetLocation}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                    >
                        {locationLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapPin className="w-4 h-4"/>}
                        {location.lat ? "Location Set" : "Get Current Location"}
                    </button>
                    {location.lat && <span className="text-xs text-green-600 flex items-center">Lat: {location.lat.toFixed(4)}...</span>}
                 </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address</label>
                <textarea 
                    rows="2"
                    placeholder="Building name, Street, Landmark..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* Data Wipe Confirmation */}
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                 <div className="flex gap-3 items-start">
                    <input 
                        type="checkbox" 
                        id="wipe-confirm"
                        className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        checked={dataWipeConfirmed}
                        onChange={(e) => setDataWipeConfirmed(e.target.checked)}
                    />
                    <label htmlFor="wipe-confirm" className="text-sm text-yellow-800 cursor-pointer">
                        <strong>Required for Electronics:</strong> I confirm that I have wiped all personal data from the devices. The recycler is not responsible for data loss.
                    </label>
                 </div>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3 items-start">
                 <AlertCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                 <p className="text-xs text-green-800">
                   By confirming, you agree that the final value may be adjusted by the collector upon physical inspection.
                 </p>
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