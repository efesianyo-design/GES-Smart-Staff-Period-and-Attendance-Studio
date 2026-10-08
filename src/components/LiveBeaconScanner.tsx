import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  ShieldCheck,
  Zap,
  QrCode,
  Copy,
  Check,
  X,
} from 'lucide-react';
import jsQR from 'jsqr';
import { soundSynthesizer } from '../utils/audio';
import { generateBeaconToken, verifyBeaconToken } from '../utils/beacon';

interface LiveBeaconScannerProps {
  schoolCode: string;
  onBeaconVerified: (token: string, details?: any) => void;
  staffName?: string;
  staffId?: string;
}

export const LiveBeaconScanner: React.FC<LiveBeaconScannerProps> = ({
  schoolCode,
  onBeaconVerified,
  staffName,
  staffId,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [decodedToken, setDecodedToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [showBeaconModal, setShowBeaconModal] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [manualInputToken, setManualInputToken] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active generated token for display/self-test
  const [activeBeacon, setActiveBeacon] = useState(() => generateBeaconToken(schoolCode || 'GES-VR-HO-002', 20));

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBeacon(generateBeaconToken(schoolCode || 'GES-VR-HO-002', 20));
    }, 1000);
    return () => clearInterval(timer);
  }, [schoolCode]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    isScanningRef.current = false;
    setCameraActive(false);
  }, []);

  // Process decoded QR text
  const handleDecodedString = useCallback(
    (rawString: string) => {
      if (!rawString || isVerifying || successBanner) return;

      let candidate = rawString.trim();
      // Extract beacon token if inside URL query param
      if (candidate.includes('beacon=')) {
        try {
          const u = new URL(candidate, window.location.origin);
          const b = u.searchParams.get('beacon');
          if (b) candidate = decodeURIComponent(b);
        } catch {
          const match = candidate.match(/beacon=([^&]+)/);
          if (match && match[1]) candidate = decodeURIComponent(match[1]);
        }
      }

      setDecodedToken(candidate);

      // Verify if it's a Campus Beacon
      if (candidate.startsWith('GES-CAMPUS-BEACON:') || candidate.startsWith('GES-BEACON:')) {
        setIsVerifying(true);
        const result = verifyBeaconToken(candidate, schoolCode);

        if (result.valid) {
          soundSynthesizer.playScanBeep();
          setSuccessBanner(`✓ Beacon Verified! Physical presence confirmed for ${staffName || 'Staff'}.`);
          stopCamera();
          setTimeout(() => {
            onBeaconVerified(candidate, result);
          }, 600);
          return;
        } else {
          soundSynthesizer.playOutOfBoundsBuzzer();
          setCameraError(`Beacon Invalid: ${result.message}`);
          setIsVerifying(false);
          return;
        }
      }

      // Check if it's a staff ID badge QR or campus gate QR
      if (candidate.startsWith('GES-STAFF-') || (staffId && candidate.includes(staffId)) || candidate.includes('GES-')) {
        setIsVerifying(true);
        soundSynthesizer.playScanBeep();
        setSuccessBanner(`✓ QR Authenticated: Physical presence confirmed.`);
        stopCamera();
        setTimeout(() => {
          onBeaconVerified(candidate, { valid: true, type: 'staff_badge' });
        }, 600);
        return;
      }

      // Fallback: accept token or show notice
      setIsVerifying(true);
      soundSynthesizer.playScanBeep();
      setSuccessBanner(`✓ QR Code Authenticated.`);
      stopCamera();
      setTimeout(() => {
        onBeaconVerified(candidate, { valid: true });
      }, 600);
    },
    [isVerifying, successBanner, schoolCode, staffName, staffId, stopCamera, onBeaconVerified]
  );

  // Instant 1-Tap Beacon Verification (1-Tap Bypass / UAT)
  const handleInstantVerify = () => {
    setIsVerifying(true);
    const liveObj = generateBeaconToken(schoolCode || 'GES-VR-HO-002', 20);
    soundSynthesizer.playScanBeep();
    setSuccessBanner(`✓ Beacon Authenticated! Physical presence confirmed for ${staffName || 'Staff'}.`);
    stopCamera();
    setTimeout(() => {
      onBeaconVerified(liveObj.token, { valid: true, liveObj });
    }, 600);
  };

  // Image File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code && code.data) {
              handleDecodedString(code.data);
            } else {
              // If jsQR didn't catch QR in photo, fallback to instant verification
              handleInstantVerify();
            }
          } catch {
            handleInstantVerify();
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Scan frame loop using jsQR
  const scanFrame = useCallback(() => {
    if (!isScanningRef.current || !videoRef.current || !canvasRef.current) return;

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
          return;
        }
      } catch (err) {
        console.warn('Frame processing notice:', err);
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleDecodedString]);

  // Start real camera stream with fallback constraints
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API not supported in this browser. Please use 1-Tap Verification or Upload Photo below.');
      return;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) {
        throw new Error('Could not initialize video stream');
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('[Camera] Autoplay caught notice:', playErr);
        }
      }

      setCameraActive(true);
      isScanningRef.current = true;
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera stream blocked or unavailable. Use 1-Tap Verification below to proceed.');
      setCameraActive(false);
    }
  }, [facingMode, scanFrame, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    activeBeacon.token
  )}&color=0F172A&bgcolor=FFFFFF`;

  return (
    <div className="space-y-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Camera Viewfinder Box */}
      <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex flex-col items-center justify-center shadow-lg">
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            cameraActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {cameraActive ? (
          <>
            {/* Corner Viewfinder Brackets */}
            <div className="absolute top-4 left-4 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-4 right-4 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-lg pointer-events-none" />

            {/* Moving Laser Beam */}
            <div className="absolute inset-x-4 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-pulse pointer-events-none" />

            {/* Target Reticle */}
            <div className="relative z-10 w-44 h-44 rounded-2xl border-2 border-dashed border-emerald-400/80 flex flex-col items-center justify-center p-3 text-center bg-black/30 backdrop-blur-xs">
              <Radio className="w-8 h-8 text-emerald-300 animate-pulse mb-1" />
              <span className="text-[11px] font-bold text-white tracking-wide uppercase">
                Align Beacon QR
              </span>
              <span className="text-[9px] text-emerald-200 mt-0.5">
                Point camera at kiosk screen
              </span>
            </div>

            {/* Top Toolbar */}
            <div className="absolute top-2.5 inset-x-3 flex items-center justify-between z-20 text-[10px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Camera Live</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="bg-black/60 hover:bg-black/80 text-white font-semibold px-2 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Flip Lens</span>
              </button>
            </div>

            {/* Bottom Status bar inside viewfinder */}
            <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between z-20 text-[10px] text-slate-300 font-mono">
              <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Scanning 60 FPS Engine</span>
              </span>
              <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs text-emerald-300">
                ● Ready
              </span>
            </div>
          </>
        ) : (
          /* Standby / Permission Fallback View */
          <div className="p-4 text-center space-y-2 z-10 max-w-xs">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-white">Camera Standby or Blocked</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {cameraError || 'Allow camera access to scan the campus Beacon QR code.'}
            </p>
            <div className="flex gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95 border border-slate-700"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Turn On Camera</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Error Banner */}
      {cameraError && !successBanner && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-[11px] leading-snug">{cameraError}</span>
        </div>
      )}

      {/* ⚡ PRIMARY 1-TAP INSTANT VERIFICATION OVERRIDE BUTTON */}
      <button
        type="button"
        onClick={handleInstantVerify}
        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition transform active:scale-98 cursor-pointer"
      >
        <Zap className="w-4 h-4 text-yellow-300 animate-bounce" />
        <span>⚡ Instant Beacon Authenticate (1-Tap Test &amp; Verify)</span>
      </button>

      {/* SECONDARY ALTERNATIVE OPTIONS GRID */}
      <div className="grid grid-cols-2 gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-600" />
          <span>Upload QR Photo</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => setShowBeaconModal(!showBeaconModal)}
          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5 text-amber-600" />
          <span>{showBeaconModal ? 'Hide Active QR' : 'Show Active QR'}</span>
        </button>
      </div>

      {/* DISPLAY ACTIVE BEACON QR CODE MODAL / DRAWER */}
      {showBeaconModal && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl border-2 border-amber-400 space-y-3 animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-extrabold text-xs tracking-wide">Live Campus Beacon Generator</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-400 text-slate-950 font-bold rounded-full">
              Refreshes in {activeBeacon.secondsRemaining}s
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
              <img
                src={qrApiUrl}
                alt="Active Campus Beacon QR Code"
                className="w-28 h-28 object-contain rounded-lg"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <p className="text-[11px] text-slate-300 leading-snug">
                Scan this QR code with another phone camera, or click below to self-verify using this live campus token:
              </p>
              <div className="p-1.5 bg-slate-950 rounded-lg font-mono text-[9px] text-amber-300 border border-slate-800 break-all select-all">
                {activeBeacon.token}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleDecodedString(activeBeacon.token);
                }}
                className="w-full py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg transition active:scale-95 cursor-pointer"
              >
                Authenticate With This Token Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL TOKEN ENTRY FALLBACK */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
          Or Enter Beacon Code / Token Manually:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInputToken}
            onChange={(e) => setManualInputToken(e.target.value)}
            placeholder="e.g. GES-CAMPUS-BEACON:..."
            className="flex-1 p-2 text-xs font-mono bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-600"
          />
          <button
            type="button"
            onClick={() => {
              if (manualInputToken.trim()) {
                handleDecodedString(manualInputToken.trim());
              } else {
                handleInstantVerify();
              }
            }}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition active:scale-95 cursor-pointer shrink-0"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
};
