import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  X,
  CheckCircle2,
  Sparkles,
  Building2,
  Radio,
  ShieldCheck,
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  AlertCircle,
} from 'lucide-react';
import jsQR from 'jsqr';
import { Classroom } from '../types';
import { soundSynthesizer } from '../utils/audio';
import { generateBeaconToken, verifyBeaconToken } from '../utils/beacon';

interface QrDoorScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: Classroom[];
  onSelectClassroom: (classroom: Classroom) => void;
  schoolCode?: string;
  onScanCampusBeacon?: (beaconToken: string) => void;
}

export const QrDoorScannerModal: React.FC<QrDoorScannerModalProps> = ({
  isOpen,
  onClose,
  classrooms,
  onSelectClassroom,
  schoolCode = 'GES-VR-HO-002',
  onScanCampusBeacon,
}) => {
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [scanTarget, setScanTarget] = useState<'doors' | 'beacon'>('beacon');
  const [beaconSuccess, setBeaconSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedData, setDetectedData] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef<boolean>(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    isScanningRef.current = false;
    setCameraActive(false);
  }, []);

  // Process a successfully decoded string from camera or file
  const handleDecodedString = useCallback(
    (rawText: string) => {
      if (!rawText) return;
      setDetectedData(rawText);

      // 1. Check if string contains a Beacon token or Beacon URL parameter
      let candidateToken = rawText.trim();
      if (candidateToken.includes('beacon=')) {
        try {
          const url = new URL(candidateToken, window.location.origin);
          const p = url.searchParams.get('beacon');
          if (p) candidateToken = decodeURIComponent(p);
        } catch {
          const match = candidateToken.match(/beacon=([^&]+)/);
          if (match && match[1]) {
            candidateToken = decodeURIComponent(match[1]);
          }
        }
      }

      if (candidateToken.startsWith('GES-CAMPUS-BEACON:')) {
        const result = verifyBeaconToken(candidateToken, schoolCode);
        if (result.valid) {
          soundSynthesizer.playScanBeep();
          setBeaconSuccess(true);
          setTimeout(() => {
            if (onScanCampusBeacon) {
              onScanCampusBeacon(candidateToken);
            }
            stopCamera();
            onClose();
            setBeaconSuccess(false);
          }, 600);
          return;
        } else {
          soundSynthesizer.playOutOfBoundsBuzzer();
          setCameraError(`Beacon Invalid: ${result.message}`);
          return;
        }
      }

      // 2. Check if string corresponds to a classroom door QR
      const matchedClass = classrooms.find((c) => {
        return (
          rawText.includes(c.code) ||
          rawText.includes(c.id) ||
          c.name.toLowerCase() === rawText.toLowerCase()
        );
      });

      if (matchedClass) {
        soundSynthesizer.playScanBeep();
        setSelectedScan(matchedClass.id);
        setTimeout(() => {
          onSelectClassroom(matchedClass);
          stopCamera();
          onClose();
          setSelectedScan(null);
        }, 500);
        return;
      }

      // Fallback: If in beacon mode, check if token can be accepted
      if (scanTarget === 'beacon' && onScanCampusBeacon) {
        onScanCampusBeacon(candidateToken);
        stopCamera();
        onClose();
      }
    },
    [classrooms, onSelectClassroom, onScanCampusBeacon, onClose, schoolCode, scanTarget, stopCamera]
  );

  // Scan frame loop using requestAnimationFrame and jsQR
  const scanFrame = useCallback(() => {
    if (!isScanningRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleDecodedString(code.data);
          return; // Stop loop after successful decode
        }
      } catch (err) {
        console.warn('Frame processing error:', err);
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleDecodedString]);

  // Start real camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported on this device/browser.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
      }

      setCameraActive(true);
      isScanningRef.current = true;
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Could not access camera. Please check camera permissions or use test buttons below.';
      setCameraError(errMsg);
      setCameraActive(false);
    }
  }, [facingMode, scanFrame, stopCamera]);

  // Handle modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setDetectedData(null);
      setCameraError(null);
      setBeaconSuccess(false);
      setSelectedScan(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Handle image file upload for QR decode
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleDecodedString(code.data);
        } else {
          soundSynthesizer.playOutOfBoundsBuzzer();
          setCameraError('No valid QR code detected in the uploaded photo.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // Simulate Instant Door Scan
  const handleSimulateScan = (cls: Classroom) => {
    setSelectedScan(cls.id);
    soundSynthesizer.playScanBeep();
    setTimeout(() => {
      onSelectClassroom(cls);
      stopCamera();
      onClose();
      setSelectedScan(null);
    }, 400);
  };

  // Simulate Instant Kiosk Beacon Scan
  const handleSimulateBeaconScan = () => {
    const beacon = generateBeaconToken(schoolCode, 20);
    soundSynthesizer.playScanBeep();
    setBeaconSuccess(true);
    setTimeout(() => {
      if (onScanCampusBeacon) {
        onScanCampusBeacon(beacon.token);
      }
      stopCamera();
      onClose();
      setBeaconSuccess(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-2xl text-slate-100 flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Optical QR &amp; Beacon Scanner</h3>
              <p className="text-[11px] text-slate-400">Real-time camera detection &amp; beacon authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Mode Tab Switcher */}
        <div className="mt-3 flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setScanTarget('beacon')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition ${
              scanTarget === 'beacon'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Kiosk Campus Beacon</span>
          </button>
          <button
            type="button"
            onClick={() => setScanTarget('doors')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition ${
              scanTarget === 'doors'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Classroom Doors ({classrooms.length})</span>
          </button>
        </div>

        {/* Camera Viewfinder Window */}
        <div className="mt-3 relative rounded-2xl border border-slate-800 bg-black min-h-[210px] max-h-[260px] flex flex-col items-center justify-center overflow-hidden">
          {/* Hidden Canvas for Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Live Video Feed */}
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover ${
              cameraActive ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            playsInline
          />

          {/* Viewfinder Target Overlays */}
          {cameraActive ? (
            <div className="relative z-10 w-44 h-44 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              {/* Laser Line Animation */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10b981] animate-pulse" />
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

              <span className="text-[10px] text-white/90 font-mono bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                {scanTarget === 'beacon' ? 'POINT AT KIOSK SCREEN' : 'ALIGN DOOR QR TAG'}
              </span>
            </div>
          ) : (
            /* Standby / Permission Fallback View */
            <div className="p-4 text-center space-y-2 z-10">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <CameraOff className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-white">Camera Standby / Permission Blocked</p>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                {cameraError || 'Allow camera access in your browser to scan the live screen.'}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Enable Camera Feed</span>
              </button>
            </div>
          )}

          {/* Bottom Bar inside Viewfinder */}
          <div className="absolute bottom-2 inset-x-2 z-20 flex items-center justify-between px-2 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
              <Sparkles className="w-3 h-3" />
              <span>{cameraActive ? '60 FPS Live Stream' : 'Simulator Mode'}</span>
            </span>

            {cameraActive && (
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="bg-black/60 hover:bg-black/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 transition"
                title="Flip Camera"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Flip Lens</span>
              </button>
            )}
          </div>
        </div>

        {/* Decode Status Feedback */}
        {detectedData && (
          <div className="mt-2 p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate font-mono text-[11px]">Decoded: {detectedData}</span>
          </div>
        )}

        {/* Content based on selected Scan Mode */}
        {scanTarget === 'doors' ? (
          <div className="mt-3 flex-1 overflow-y-auto no-scrollbar space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Simulate Classroom Door Scan:</span>
              <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Scan Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {classrooms.map((cls) => {
                const isScanning = selectedScan === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => handleSimulateScan(cls)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-left transition ${
                      isScanning
                        ? 'bg-emerald-600/30 border-emerald-500 scale-[0.98]'
                        : 'bg-slate-950/60 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-md bg-slate-800 flex-shrink-0 flex items-center justify-center text-slate-300 font-mono text-[10px] font-bold">
                      {cls.code}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{cls.name}</p>
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5" />
                        {cls.block}
                      </p>
                    </div>
                    {isScanning && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3 flex-1 flex flex-col justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white">
                <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>Staff Common Room Live QR Beacon</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Point this phone at the rotating QR code on the staff-room tablet, or tap below to authenticate presence instantly.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleSimulateBeaconScan}
                className={`flex-[2] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  beaconSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                }`}
              >
                {beaconSuccess ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Presence Authenticated!</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    <span>Instant Authenticate Beacon</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>GES Optical Anti-Proxy Layer</span>
          </span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
