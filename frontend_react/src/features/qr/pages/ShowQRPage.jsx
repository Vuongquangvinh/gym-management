// src/features/qr/pages/ShowQRPage.jsx
import React from "react";
import QRCodeGenerator from "../components/QRCodeGenerator";



const now = new Date();

const dayInfor = {
  date: now.toLocaleDateString("vi-VN"), 
  time: now.toLocaleTimeString("vi-VN"),
};

// **Bước quan trọng: Kết hợp tất cả thông tin lại**
// Sử dụng JSON.stringify() để chuyển object thành chuỗi JSON
const qrData = JSON.stringify({

  timestamp: dayInfor,
  // Thêm một mã xác nhận duy nhất (nếu cần)
  // uniqueCode: "SOME_UNIQUE_HASH"
});

function ShowQRPage() {
  return (
    <div>
      {/* Truyền chuỗi JSON đã kết hợp vào prop 'info' của QRCodeGenerator.
        Component QRCodeGenerator sẽ dùng chuỗi này để tạo mã QR.
      */}
      <QRCodeGenerator info={qrData} />
    </div>
  );
}

export default ShowQRPage;
