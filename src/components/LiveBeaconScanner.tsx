import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { RefreshCw, Radio, CheckCircle2, AlertTriangle } from 'lucide-react';
import { soundSynthesizer } from '../utils/audio';

interface Props {
  onBeaconVerified: (beaconPayload: string, details?: any) => void;
  schoolCode?: string;
  staffName?: string;
  staffId?: string;
}

export default function BeaconQrLiveScanner({
  onBeaconVerified,
  schoolCode,
  staffName,
  staffId,
}: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanError, setScanError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const isVerifiedRef = useRef(false);

  useEffect(() => {
    const id = 'beacon-qr-reader';
    isVerifiedRef.current = false;

    const scanner = new Html5Qrcode(id, { verbose: false });
    scannerRef.current = scanner;

    let isMounted = true;

    const startScanner = async () => {
      try {
        setScanError(null);
        if (scanner.isScanning) {
          await scanner.stop();
        }

        await scanner.start(
          { facingMode },
          {
            fps: 30, // Real-time high speed scanning
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.75);
              return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isVerifiedRef.current || !isMounted) return;
            isVerifiedRef.current = true;

            try {
              soundSynthesizer.playScanBeep();
            } catch (e) {
              // Ignore audio errors
            }

            setSuccessBanner(`✓ Beacon QR Code Verified!`);

            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current
                .stop()
                .then(() => {
                  try {
                    scannerRef.current?.clear();
                  } catch (e) {}
                  setIsScanning(false);
                  onBeaconVerified(decodedText, { valid: true, payload: decodedText });
                })
                .catch(() => {
                  setIsScanning(false);
                  onBeaconVerified(decodedText, { valid: true, payload: decodedText });
                });
            } else {
              setIsScanning(false);
              onBeaconVerified(decodedText, { valid: true, payload: decodedText });
            }
          },
          () => {
            // Frame parse error - silent for non-QR frames
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: any) {
        console.warn('Html5Qrcode scanner start error:', err);
        if (isMounted) {
          setIsScanning(false);
          setScanError('Camera access required or scanner failed to start. Please check permissions.');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => {
              try {
                scannerRef.current?.clear();
              } catch (e) {}
            })
            .catch(() => {});
        } else {
          try {
            scannerRef.current.clear();
          } catch (e) {}
        }
      }
    };
  }, [facingMode, schoolCode, onBeaconVerified]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="space-y-3">
      {/* Live Camera Scanner Box */}
      <div className="relative w-full h-72 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex flex-col items-center justify-center shadow-lg">
        {/* Container for html5-qrcode video mount */}
        <div id="beacon-qr-reader" className="w-full h-full overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

        {/* Top Overlay Bar */}
        <div className="absolute top-2.5 inset-x-3 flex items-center justify-between z-20 text-[10px]">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isScanning ? 'Camera Live (30 FPS)' : 'Initializing...'}</span>
          </span>
          <button
            type="button"
            onClick={toggleCameraFacing}
            className="bg-black/60 hover:bg-black/80 text-white font-semibold px-2 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Flip Camera</span>
          </button>
        </div>

        {/* Corner Viewfinder Brackets */}
        <div className="absolute top-4 left-4 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg pointer-events-none z-10" />
        <div className="absolute top-4 right-4 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg pointer-events-none z-10" />
        <div className="absolute bottom-4 left-4 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg pointer-events-none z-10" />
        <div className="absolute bottom-4 right-4 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-lg pointer-events-none z-10" />

        {/* Moving Laser Beam */}
        <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-pulse pointer-events-none z-10" />

        {/* Bottom Status bar inside viewfinder */}
        <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between z-20 text-[10px] text-slate-300 font-mono">
          <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Optical Beacon Engine</span>
          </span>
          <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs text-emerald-300">
            ● Direct Camera Only
          </span>
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Error Banner */}
      {scanError && !successBanner && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[11px] leading-snug">{scanError}</span>
        </div>
      )}
    </div>
  );
}

export { BeaconQrLiveScanner };
export const LiveBeaconScanner = BeaconQrLiveScanner;
