"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRDisplayProps {
  value: string;
  size?: number;
  title?: string;
}

export default function QRDisplay({ value, size = 256, title }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center space-y-3">
      {title && (
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      )}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          includeMargin
        />
      </div>
      <p className="text-xs text-gray-400">QR kodu taratarak işlem yapın</p>
    </div>
  );
}
