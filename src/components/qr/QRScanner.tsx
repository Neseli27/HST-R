"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("qr-reader-" + Math.random().toString(36).slice(2));

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function startScanning() {
    try {
      const scanner = new Html5Qrcode(containerRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => {});
          setIsScanning(false);
        },
        () => {} // Ignore scan failures
      );

      setIsScanning(true);
    } catch (err: any) {
      onError?.(err.message || "Kamera açılamadı");
    }
  }

  async function stopScanning() {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        id={containerRef.current}
        className="mx-auto w-full max-w-sm overflow-hidden rounded-xl"
      />

      {!isScanning ? (
        <button
          onClick={startScanning}
          className="w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700"
        >
          QR Kod Tara
        </button>
      ) : (
        <button
          onClick={stopScanning}
          className="w-full rounded-lg bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
        >
          Taramayı Durdur
        </button>
      )}
    </div>
  );
}
