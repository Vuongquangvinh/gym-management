// src/features/qr/components/QRCodeGenerator.jsx
import React from "react";
import { QRCodeSVG } from 'qrcode.react';

const QRCodeGenerator = ({ 
  info, 
  size = 256, 
  level = "M", 
  bgColor = "#fcfcfcff", 
  fgColor = "#020202ff", 
  title = "Quét mã qr để vào phòng",
   minVersion = 10, 
   excavate = true, 
   imageSettings = { 
    src: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg', 
    height: 10, 
    width: 10, 
    opacity: 0.8 } }) => { 
    const qrValue = typeof info === "object" ? JSON.stringify(info) : info;

  return (
    <div>
      <h3>Mã QR</h3>
      {/* Có thể truyền prop size để thay đổi kích thước */}
      <QRCodeSVG value={qrValue} width={size} height={size} level={level} bgColor={bgColor} fgColor={fgColor}  title={title} minVersion={minVersion} excavate={excavate} imageSettings={imageSettings} />
    </div>
  );
};

export default QRCodeGenerator;