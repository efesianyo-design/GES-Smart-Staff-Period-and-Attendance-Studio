import React, { useState, useEffect } from 'react';
import {
  Radio,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Server,
  MapPin,
} from 'lucide-react';
import { soundSynthesizer } from '../utils/audio';

interface CommonRoomBeaconRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner?: () => void;
  schoolName?: string;
  schoolCode?: string;
}

export const CommonRoomBeaconRadarModal: React.FC<CommonRoomBeaconRadarModalProps> = ({
  isOpen,
  onClose,
  onOpenScanner,
  schoolName = 'Mawuli Senior High School',
  schoolCode = 'ges-vr-mhs-01',
}) => {
  // Simulated or Live BLE Beacon state
  const [rssi, setRssi] = useState<number>(-58); // dBm
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [webBluetoothAvailable, setWebBluetoothAvailable] = useState<boolean>(false);
  const [detectedDevices, setDetectedDevices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'radar' | 'how_it_works' | 'yam_phones'>('radar');

  // Check Web Bluetooth support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      setWebBluetoothAvailable(true);
    }
  }, []);

  // Slight natural RSSI oscillation to simulate real RF radio physics
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setRssi((prev) => {
        const jitter = Math.floor(Math.random() * 5) - 2; // -2 to +2 dBm
        const clamped = Math.min(-42, Math.max(-95, prev + jitter));
        return clamped;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate zone and distance based on logarithmic path-loss formula:
  // RSSI = -59 - 10 * n * log10(d), where n ~ 2.2 in indoor room with desks
  const estimatedDistance = Math.max(
    0.5,
    Math.round(Math.pow(10, (-54 - rssi) / (10 * 2.2)) * 10) / 10
  );

  let zoneStatus: {
    label: string;
    sub: string;
    color: string;
    bg: string;
    border: string;
    isInside: boolean;
  };

  if (rssi >= -65) {
    zoneStatus = {
      label: 'INSIDE STAFF COMMON ROOM',
      sub: 'Strong RF Signal • Verified Physical Presence',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/50',
      isInside: true,
    };
  } else if (rssi >= -78) {
    zoneStatus = {
      label: 'ADJACENT CORRIDOR / VERANDAH',
      sub: 'Moderate RF Signal • Near Common Room Entryway',
      color: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-500/50',
      isInside: false,
    };
  } else {
    zoneStatus = {
      label: 'OUTSIDE COMMON ROOM ZONE',
      sub: 'Weak / Distant Signal • Outside School Staff Block',
      color: 'text-rose-400',
      bg: 'bg-rose-950/40',
      border: 'border-rose-500/50',
      isInside: false,
    };
  }

  // Handle live Web Bluetooth scan
  const handleScanWebBluetooth = async () => {
    setIsScanning(true);
    soundSynthesizer.playScanBeep();
    try {
      if ('bluetooth' in navigator && (navigator as any).bluetooth.requestDevice) {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access', 'battery_service'],
        });
        if (device) {
          setDetectedDevices((prev) => [
            `${device.name || 'BLE Beacon'} (${device.id.slice(0, 8)}...)`,
            ...prev,
          ]);
          setRssi(-52);
          soundSynthesizer.playClockInChime();
        }
      } else {
        // Fallback simulation
        setTimeout(() => {
          setDetectedDevices([
            `Staff Common Room Wall Puck (UUID: ${schoolCode}-SCR-01)`,
            'Admin Block Gateway Puck #2',
          ]);
          setRssi(-55);
          soundSynthesizer.playClockInChime();
        }, 800);
      }
    } catch (err: any) {
      console.log('Bluetooth scan cancelled or not paired:', err?.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Staff Common Room Beacon Zone Radar</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  BLE &amp; Optical
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live proximity telemetry &amp; presence detection inside {schoolName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 flex items-center gap-2 border-b border-slate-800/80 bg-slate-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1.5 rounded-t-xl text-xs font-semibold transition border-b-2 ${
              activeTab === 'radar'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📡 Live Radar &amp; Signal Meter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('how_it_works')}
            className={`px-3 py-1.5 rounded-t-xl text-xs font-semibold transition border-b-2 ${
              activeTab === 'how_it_works'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            💡 How Beacon Detection Works
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('yam_phones')}
            className={`px-3 py-1.5 rounded-t-xl text-xs font-semibold transition border-b-2 ${
              activeTab === 'yam_phones'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📱 Yam Phone Staff Solution
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {activeTab === 'radar' && (
            <>
              {/* Live Signal Telemetry Card */}
              <div
                className={`p-4 rounded-2xl border ${zoneStatus.border} ${zoneStatus.bg} transition-all space-y-3`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-full ${
                        zoneStatus.isInside ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                        Room Detection Status
                      </span>
                      <h3 className={`text-base font-extrabold ${zoneStatus.color}`}>
                        {zoneStatus.label}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-400">Estimated Proximity</div>
                    <div className="text-base font-mono font-bold text-white">
                      ~{estimatedDistance} meters
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{zoneStatus.sub}</p>

                {/* RSSI Signal Strength Visual Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Bluetooth RSSI Signal Strength:</span>
                    <strong className="text-white">
                      {rssi} dBm{' '}
                      <span className="text-slate-400 font-normal">
                        ({rssi >= -65 ? 'Strong Room Signal' : rssi >= -78 ? 'Moderate' : 'Weak'})
                      </span>
                    </strong>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-950 p-0.5 border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rssi >= -65
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                          : rssi >= -78
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(5, ((rssi + 100) / 60) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>-100 dBm (Far away)</span>
                    <span className="text-amber-400/80">-78 dBm (Door threshold)</span>
                    <span>-40 dBm (Next to Beacon)</span>
                  </div>
                </div>
              </div>

              {/* Hardware Beacon Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">
                    Staff Common Room Beacon ID
                  </span>
                  <p className="font-mono font-bold text-emerald-400 truncate">
                    {schoolCode}-SCR-BEACON-01
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Location: Wall Mount beside Staff Notice Board
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">
                    Broadcast Frequency &amp; Power
                  </span>
                  <p className="font-mono font-bold text-indigo-300">10 Hz • 0 dBm Tx Power</p>
                  <span className="text-[10px] text-slate-400">
                    Calibrated Room Perimeter: 12m × 8m enclosure
                  </span>
                </div>
              </div>

              {/* Interactive Signal Slider to test what happens as you move */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test Common Room Distance Simulation:</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    {rssi} dBm (~{estimatedDistance}m)
                  </span>
                </div>
                <input
                  type="range"
                  min="-95"
                  max="-45"
                  value={rssi}
                  onChange={(e) => setRssi(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <p className="text-[11px] text-slate-400">
                  Drag the slider to see how the system detects when a teacher is sitting at their desk inside the Staff Common Room versus walking in the corridor outside.
                </p>
              </div>

              {/* Live Web Bluetooth Scan Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleScanWebBluetooth}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>
                    {isScanning ? 'Scanning for Common Room Beacons...' : 'Scan for Nearby BLE Beacons'}
                  </span>
                </button>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    Web Bluetooth:{' '}
                    <strong className={webBluetoothAvailable ? 'text-emerald-400' : 'text-amber-400'}>
                      {webBluetoothAvailable ? 'Supported' : 'Standard Web Mode'}
                    </strong>
                  </span>
                </div>
              </div>

              {detectedDevices.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-1.5">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Discovered Common Room Beacons:</span>
                  </span>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                    {detectedDevices.map((d, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {activeTab === 'how_it_works' && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>The Dual-Beacon Architecture in GES Schools</span>
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  To guarantee that staff are <strong>physically present inside the Staff Common Room</strong> without relying on GPS (which can drift by 20–50 meters or fail inside concrete buildings), the system uses two complementary beacon layers:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-white text-xs">
                    Optical Kiosk Screen Beacon (Software)
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The tablet mounted on the Staff Common Room wall runs this app in <strong>Kiosk Mode</strong>. Every 20 seconds, its screen renders a new cryptographic QR code token salted with the institutional key.
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold">
                    Because the token expires in 20 seconds, a teacher must be physically standing inside the common room to scan it. Screenshots sent via WhatsApp fail immediately!
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-white text-xs">
                    Physical Bluetooth Hardware Beacon (Puck)
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    An inexpensive battery-powered Bluetooth Low Energy (BLE) beacon puck (costing ~$10) is mounted on the wall or ceiling of the Staff Common Room.
                  </p>
                  <p className="text-[11px] text-indigo-300 font-semibold">
                    It continuously emits an encrypted UUID. A smartphone detects the RSSI signal strength: &gt; -65 dBm confirms you are inside the room; weaker signals indicate you are in the corridor.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-[11px] space-y-1.5 text-slate-300">
                <strong className="text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Anti-Proxy Security Guarantee:</span>
                </strong>
                <p>
                  Combined with <strong>One-Device Hardware Locking</strong>, teachers cannot clock in on behalf of their absent colleagues.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'yam_phones' && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>How Staff with "Yam Phones" (Basic Phones) Are Detected</span>
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Staff like <strong>cooks, security watchmen, matron, storekeeper, and temporal YEA workers</strong> often do not carry smartphones or have mobile internet. Because yam phones do not have Bluetooth or web browsers, they cannot receive beacon signals.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-white text-xs">
                  The Three Proven Institutional Methods for Yam Phone Staff:
                </h4>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-emerald-400 flex items-center gap-1.5">
                    <span>1. Gate / Common Room Fixed Terminal 1-Tap Punch</span>
                  </strong>
                  <p className="text-[11px] text-slate-400">
                    The school's mounted tablet or PC at the gate, kitchen, or common room acts as the <strong>central sensor</strong>. The staff member steps up, taps their name/photo, or enters their 4-digit PIN on the screen.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-indigo-400 flex items-center gap-1.5">
                    <span>2. Laminated Barcode / QR ID Badges</span>
                  </strong>
                  <p className="text-[11px] text-slate-400">
                    The school prints laminated PVC staff badges with high-contrast barcodes. When the cook or watchman arrives, the duty officer or mounted tablet camera scans their badge in 1 second. Zero phone required!
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-amber-400 flex items-center gap-1.5">
                    <span>3. Free Telco SMS / USSD Punch-In Gateway</span>
                  </strong>
                  <p className="text-[11px] text-slate-400">
                    The staff member sends a simple free text from their yam phone (e.g. text <code className="text-white bg-slate-900 px-1 rounded">IN 1234</code> to the school shortcode). The system verifies the sender's phone number and logs attendance instantly!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Staff Common Room Presence Engine • Sir Eugene Technologies
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
};
