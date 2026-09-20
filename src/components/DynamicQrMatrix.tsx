import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface DynamicQrMatrixProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
  margin?: number;
  altText?: string;
}

/**
 * Production-grade Real-Time ISO/IEC 18004 Compliant QR Code Generator
 * Generates standards-compliant QR codes that can be scanned by any smartphone camera,
 * Google Lens, iOS Camera, or in-app optical decoders.
 */
export const DynamicQrMatrix: React.FC<DynamicQrMatrixProps> = ({
  value,
  size = 180,
  className = '',
  fgColor = '#0f172a',
  bgColor = '#ffffff',
  margin = 1,
  altText = 'Dynamic GES Campus QR Beacon',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!value) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(value, {
      width: size * 2, // 2x resolution for retina and sharp scanning
      margin,
      errorCorrectionLevel: 'M',
      color: {
        dark: fgColor,
        light: bgColor,
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('QR code generation failed:', err);
        if (isMounted) {
          setError('Failed to render QR Code');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, fgColor, bgColor, margin]);

  if (error) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-slate-900 border border-slate-800 text-rose-400 text-xs p-2 rounded-xl text-center ${className}`}
      >
        <span>{error}</span>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl animate-pulse ${className}`}
      >
        <span className="text-[10px] text-slate-500 font-mono">Generating QR...</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={altText}
      width={size}
      height={size}
      className={`rounded-xl shadow-md border border-white/10 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        backgroundColor: bgColor,
      }}
    />
  );
};
