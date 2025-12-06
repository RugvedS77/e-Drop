import React, { useState } from 'react';
import { 
  Shield, 
  Smartphone, 
  Laptop, 
  HardDrive, 
  Lock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  X,
  FileWarning
} from 'lucide-react';

// --- UTILITY ---
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- INLINE COMPONENTS ---

// 1. Badge Component (Light Theme)
const Badge = ({ children, variant, icon: Icon }) => {
  const styles = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-100 text-amber-700 border-amber-200", 
    default: "bg-gray-100 text-gray-700 border-gray-200"
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", styles[variant] || styles.default)}>
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
};

// 2. Modal Component (Light Theme)
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/50">{children}</div>
      </div>
    </div>
  );
};

// --- DATA ---
const deviceGuides = [
  {
    id: 'smartphone',
    name: 'Smartphone',
    icon: Smartphone,
    description: 'iPhone, Android, and other mobile devices',
    steps: [
      { title: 'Backup your data', description: 'Transfer photos, contacts, and important files to cloud or computer' },
      { title: 'Sign out of accounts', description: 'Log out of iCloud, Google, social media, and banking apps' },
      { title: 'Remove SIM card', description: 'Take out your SIM card and memory card if applicable' },
      { title: 'Encrypt device', description: 'Enable encryption in settings before wiping' },
      { title: 'Factory reset', description: 'Go to Settings > General > Reset > Erase All Content' },
    ],
  },
  {
    id: 'laptop',
    name: 'Laptop/Computer',
    icon: Laptop,
    description: 'Windows, Mac, and Linux computers',
    steps: [
      { title: 'Backup important files', description: 'Copy documents, photos, and other files to external drive or cloud' },
      { title: 'Deauthorize software', description: 'Sign out of iTunes, Adobe, Office, and other licensed software' },
      { title: 'Encrypt hard drive', description: 'Use BitLocker (Windows) or FileVault (Mac) to encrypt' },
      { title: 'Secure erase', description: 'Use DBAN or manufacturer tools for secure deletion' },
      { title: 'Reinstall OS', description: 'Clean install of operating system or leave drive empty' },
    ],
  },
  {
    id: 'storage',
    name: 'Storage Devices',
    icon: HardDrive,
    description: 'Hard drives, SSDs, USB drives, and memory cards',
    steps: [
      { title: 'Identify drive type', description: 'HDDs and SSDs require different wiping methods' },
      { title: 'Use secure erase tool', description: 'DBAN for HDD, manufacturer tools for SSD' },
      { title: 'Multiple passes', description: 'Use at least 3-pass overwrite for HDDs' },
      { title: 'Verify deletion', description: 'Run data recovery software to confirm wipe' },
      { title: 'Physical destruction', description: 'For sensitive data, consider professional shredding' },
    ],
  },
];

const securityTips = [
  { icon: Lock, title: 'Encrypt First', description: 'Always encrypt before wiping for extra security.' },
  { icon: RefreshCw, title: 'Multiple Passes', description: 'Standard is 3-7 passes for mechanical HDDs.' },
  { icon: AlertTriangle, title: 'Verify Wipe', description: 'Test with recovery software after wiping.' },
  { icon: Shield, title: 'Keep Records', description: 'Document the data destruction process.' },
];

// --- MAIN COMPONENT ---
export default function DataWipeGuide() {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [completedSteps, setCompletedSteps] = useState({});

  const openGuide = (device) => {
    setSelectedDevice(device);
    setShowModal(true);
  };

  const toggleStep = (deviceId, stepIndex) => {
    setCompletedSteps(prev => {
      const deviceSteps = prev[deviceId] || [];
      if (deviceSteps.includes(stepIndex)) {
        return { ...prev, [deviceId]: deviceSteps.filter(i => i !== stepIndex) };
      }
      return { ...prev, [deviceId]: [...deviceSteps, stepIndex] };
    });
  };

  const getProgress = (deviceId, totalSteps) => {
    const completed = completedSteps[deviceId]?.length || 0;
    return Math.round((completed / totalSteps) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 pb-20">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
             <Shield className="text-emerald-600 fill-emerald-100" /> Data Wipe Guide
          </h1>
          <p className="text-gray-500 text-sm mt-1">Securely erase your data before recycling</p>
        </div>
      </header>

      <div className="space-y-8">
        
        {/* Hero Section - Clean White Card */}
        <div className="relative rounded-2xl bg-white border border-gray-200 p-8 overflow-hidden shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <Badge variant="emerald" icon={Shield}>Security First</Badge>
            <h2 className="text-3xl font-bold mt-4 mb-3 text-gray-900">
              Protect Your <span className="text-emerald-600">Digital Privacy</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Before recycling your devices, ensure all personal data is securely erased. 
              Follow our step-by-step guides to prevent data theft and protect your identity.
            </p>
          </div>
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Shield size={200} />
          </div>
        </div>

        {/* Security Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {securityTips.map((tip) => (
            <div
              key={tip.title}
              className="group p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                <tip.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
              <p className="text-sm text-gray-500">{tip.description}</p>
            </div>
          ))}
        </div>

        {/* Device Guides Selection */}
        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Laptop className="w-5 h-5 text-emerald-600" /> Select Your Device
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deviceGuides.map((device) => {
              const progress = getProgress(device.id, device.steps.length);
              const Icon = device.icon;
              return (
                <button
                  key={device.id}
                  onClick={() => openGuide(device)}
                  className="relative group p-6 rounded-2xl bg-white border border-gray-200 text-left transition-all duration-300 hover:shadow-lg hover:border-emerald-500 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                      <Icon className="w-7 h-7 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <ChevronRight size={16} />
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">{device.name}</h4>
                  <p className="text-sm text-gray-500 mb-6">{device.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Wipe Progress</span>
                      <span className="text-emerald-600 font-semibold">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Warning Section */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
              <FileWarning className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 mb-1">Irreversible Action</h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                Data wiping is permanent. Ensure you have backed up all important files to a cloud service or external drive before proceeding. 
                For highly sensitive corporate data, consider professional physical destruction services.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Device Guide Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedDevice ? `${selectedDevice.name} Guide` : ''}
      >
        {selectedDevice && (
          <div className="space-y-6">
            {/* Device Header in Modal */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                 <selectedDevice.icon className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900">{selectedDevice.name}</h4>
                <p className="text-sm text-emerald-700/80">{selectedDevice.description}</p>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-3">
              {selectedDevice.steps.map((step, index) => {
                const isCompleted = completedSteps[selectedDevice.id]?.includes(index);
                return (
                  <button
                    key={index}
                    onClick={() => toggleStep(selectedDevice.id, index)}
                    className={cn(
                      'w-full flex items-start gap-4 p-4 rounded-xl transition-all text-left border',
                      isCompleted 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all mt-0.5 border',
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-500'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle size={14} />
                      ) : (
                        <span className="text-xs font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <h5 className={cn(
                        'font-medium transition-colors',
                        isCompleted ? 'text-emerald-900 line-through decoration-emerald-500/30' : 'text-gray-900'
                      )}>
                        {step.title}
                      </h5>
                      <p className={cn(
                          "text-sm mt-1",
                          isCompleted ? "text-emerald-700/60" : "text-gray-500"
                      )}>{step.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress Summary Footer */}
            <div className="p-4 rounded-xl bg-white border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Completion Status</span>
                <span className="text-sm text-emerald-600 font-bold">
                  {completedSteps[selectedDevice.id]?.length || 0} / {selectedDevice.steps.length} Steps
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${getProgress(selectedDevice.id, selectedDevice.steps.length)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}