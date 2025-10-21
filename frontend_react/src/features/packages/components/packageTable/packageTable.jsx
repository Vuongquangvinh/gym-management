import React, { useEffect, useState } from "react";
import "./packageTable.css";
import DetailPackage from "../detailPackage/detailPackage.jsx";
import AddNewPackage from "../addNewPackage/addNewPackage.jsx";
import PackageModel from "../../../../firebase/lib/features/package/packages.model.js";

const statusConfig = {
  active: { label: "Đang áp dụng", className: "status-active" },
  inactive: { label: "Ngừng áp dụng", className: "status-inactive" }
};

export default function PackageTable({ onSelectPackage }) {
  const [searchTerm] = useState("");
  const [filterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [packageData, setPackageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy danh sách package từ Firebase khi component mount
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        const packages = await PackageModel.getAll();
        
        // Transform data từ PackageModel sang format UI
        const transformedPackages = packages.map(pkg => ({
          id: pkg.PackageId, // User-defined ID để hiển thị
          firestoreId: pkg._firestoreId, // Firestore document ID để update/delete
          name: pkg.PackageName,
          type: pkg.PackageType,
          duration: `${pkg.Duration} ngày`,
          price: `${pkg.Price.toLocaleString('vi-VN')}đ`,
          description: pkg.Description || "",
          sessions: pkg.NumberOfSession || 0,
          offer: pkg.Discount ? `Giảm ${pkg.Discount}%` : "Không có ưu đãi",
          status: pkg.Status,
          startDate: pkg.StartDayDiscount ? pkg.StartDayDiscount.toLocaleDateString('vi-VN') : "",
          endDate: pkg.EndDayDiscount ? pkg.EndDayDiscount.toLocaleDateString('vi-VN') : "",
          maxRegister: 100, // Có thể thêm field này vào model nếu cần
          promotion: pkg.UsageCondition || "Không có điều kiện đặc biệt",
          finalPrice: pkg.getFinalPrice(),
          rawData: pkg // Giữ lại data gốc nếu cần
        }));
        
        setPackageData(transformedPackages);
        console.log("✅ Đã load", transformedPackages.length, "packages từ Firebase");
      } catch (error) {
        console.error("❌ Error fetching packages:", error);
        setError("Không thể tải dữ liệu gói tập. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const filteredData = packageData.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || pkg.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (showAdd) {
    return <AddNewPackage onCancel={() => setShowAdd(false)} onSave={() => {
      setShowAdd(false);
      // Reload packages sau khi thêm mới
      window.location.reload(); // Hoặc gọi lại fetchPackages
    }} />;
  }

  return (
    <div className="package-wrapper"> 
      <div className="package-header">
        <button onClick={() => setShowAdd(true)}>Thêm mới</button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #E0E0E0',
            borderTop: '4px solid #0D47A1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#546E7A', fontSize: '15px', fontWeight: '500' }}>
            Đang tải dữ liệu...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#FEF2F2',
          borderRadius: '16px',
          margin: '20px'
        }}>
          <p style={{ color: '#EF4444', fontSize: '15px', fontWeight: '500', marginBottom: '20px' }}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#0D47A1',
              color: 'white',
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Package List */}
      {!loading && !error && (
        <div className="package-list">
        {filteredData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="empty-text">Không tìm thấy gói tập phù hợp</p>
          </div>
        ) : (
          filteredData.map(pkg => (
            <div key={pkg.id} className="package-card">
              <div className="package-content">
                <div className="package-top">
                  <div className="package-identity">
                    <div className="package-icon">
                      {pkg.id.slice(-2)}
                    </div>
                    <div className="package-name-section">
                      <h3>{pkg.name}</h3>
                      <div className="package-code">Mã: {pkg.id}</div>
                    </div>
                  </div>
                  <div className={`status-badge ${statusConfig[pkg.status].className}`}>
                    <span className="status-dot"></span>
                    {statusConfig[pkg.status].label}
                  </div>
                </div>

                <p className="package-description">{pkg.description}</p>

                <div className="package-grid">
                  <div className="info-box type">
                    <div className="info-label">Loại gói</div>
                    <div className="info-value">{pkg.type}</div>
                  </div>
                  <div className="info-box duration">
                    <div className="info-label">Thời hạn</div>
                    <div className="info-value">{pkg.duration}</div>
                  </div>
                  <div className="info-box price">
                    <div className="info-label">Giá</div>
                    <div className="info-value">{pkg.price}</div>
                  </div>
                  <div className="info-box sessions">
                    <div className="info-label">Số buổi tập</div>
                    <div className="info-value">{pkg.sessions} buổi</div>
                  </div>
                </div>

                <div className="package-details">
                  <div className="detail-item">
                    <div className="detail-label">Ưu đãi đặc biệt</div>
                    <div className="detail-value">
                      <svg className="detail-icon icon-star" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {pkg.offer}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Khuyến mãi</div>
                    <div className="detail-value">
                      <svg className="detail-icon icon-gift" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                      </svg>
                      {pkg.promotion}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Thời gian áp dụng</div>
                    <div className="detail-value">
                      {pkg.startDate} → {pkg.endDate}
                    </div>
                  </div>
                </div>
                <div className="package-actions">
                  <button className="action-btn view-detail" onClick={() => onSelectPackage(pkg)}>
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      )}
    </div>
  );
}