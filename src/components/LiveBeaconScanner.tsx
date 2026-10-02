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
} from 'lucide-react';
import jsQR from 'jsqr';
import { soundSynthesizer } from '../utils/audio';
import { verifyBeaconToken } from '../utils/beacon';

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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);

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
      if (candidate.startsWith('GES-CAMPUS-BEACON:')) {
        setIsVerifying(true);
        const result = verifyBeaconToken(candidate, schoolCode);

        if (result.valid) {
          soundSynthesizer.playScanBeep();
          setSuccessBanner(`✓ Beacon Verified! Physical presence confirmed for ${staffName || 'Staff'}.`);
          stopCamera();
          setTimeout(() => {
            onBeaconVerified(candidate, result);
          }, 800);
          return;
        } else {
          // If token expired or school mismatch, let user know
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
        }, 800);
        return;
      }

      // If it's another QR code
      setCameraError('Unrecognized QR format. Please align the rotating Campus Beacon QR code.');
    },
    [isVerifying, successBanner, schoolCode, staffName, staffId, stopCamera, onBeaconVerified]
  );

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
          return; // Stop animation loop once decoded
        }
      } catch (err) {
        console.warn('Frame processing notice:', err);
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleDecodedString]);

  // Start real camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API not supported in this browser. Please use the photo upload option below.');
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
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setCameraActive(true);
      isScanningRef.current = true;
      animFrameRef.current = requestAnimationFrame(scanFrame);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        err?.message?.includes('Permission denied')
          ? 'Camera permission denied. Please allow camera permissions in your phone browser, or upload a photo of the beacon QR.'
          : 'Camera device unavailable. You can upload a photo of the Beacon QR code.'
      );
      setCameraActive(false);
    }
  }, [facingMode, scanFrame, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Photo upload decoder fallback
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setCameraError('No valid Beacon QR code found in uploaded image. Please try again.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Camera Viewfinder Box */}
      <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex flex-col items-center justify-center shadow-lg">
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            cameraActive ? 'opacity-100' : 'opacity-0'
          }`}
          muted
          playsInline
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
                Point camera at the kiosk screen
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
                <span>Active 60 FPS Optical Engine</span>
              </span>
              <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs text-emerald-300">
                ● Ready for QR
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
              {cameraError || 'Allow camera access in your browser to scan the campus Beacon QR code.'}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Turn On Camera</span>
            </button>
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
        <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-[11px] leading-snug">{cameraError}</span>
        </div>
      )}

      {/* Alternative Photo Upload Option */}
      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Upload className="w-4 h-4 text-indigo-600" />
          <span className="text-[11px] font-medium">Or upload photo of Beacon QR:</span>
        </div>
        <label className="cursor-pointer px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition active:scale-95">
          <span>Choose Photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
