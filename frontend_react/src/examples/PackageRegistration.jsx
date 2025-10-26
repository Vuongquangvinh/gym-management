/**
 * ================================================
 * EXAMPLE COMPONENT: PACKAGE REGISTRATION
 * ================================================
 * Component cho phép user chọn và đăng ký gói tập
 */

import React, { useState, useEffect } from 'react';
import { PackageModel } from '../../firebase/lib/features/package/packages.model.js';
import UserModel from '../../firebase/lib/features/user/user.model.js';

const PackageRegistration = ({ userId }) => {
  const [packages, setPackages] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPackageInfo, setCurrentPackageInfo] = useState(null);

  // Load danh sách gói tập và thông tin user
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Lấy danh sách gói tập active
        const activePackages = await PackageModel.getAll({ status: 'active' });
        setPackages(activePackages);

        // Lấy thông tin user
        const userInfo = await UserModel.getById(userId);
        setUser(userInfo);

        // Lấy thông tin gói tập hiện tại (nếu có)
        if (userInfo && userInfo.current_package_id) {
          const currentPkg = await userInfo.getCurrentPackage();
          setCurrentPackageInfo(currentPkg);
        }
      } catch (error) {
        console.error('Lỗi khi load dữ liệu:', error);
        setMessage('Lỗi khi tải dữ liệu: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const reloadData = async () => {
    try {
      setLoading(true);

      // Lấy danh sách gói tập active
      const activePackages = await PackageModel.getAll({ status: 'active' });
      setPackages(activePackages);

      // Lấy thông tin user
      const userInfo = await UserModel.getById(userId);
      setUser(userInfo);

      // Lấy thông tin gói tập hiện tại (nếu có)
      if (userInfo && userInfo.current_package_id) {
        const currentPkg = await userInfo.getCurrentPackage();
        setCurrentPackageInfo(currentPkg);
      }
    } catch (error) {
      console.error('Lỗi khi load dữ liệu:', error);
      setMessage('Lỗi khi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký gói tập
  const handleRegister = async () => {
    if (!selectedPackage) {
      setMessage('Vui lòng chọn gói tập');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const result = await user.registerPackage(selectedPackage.PackageId);
      setMessage(`✅ ${result.message}`);
      
      // Reload dữ liệu
      await reloadData();
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      setMessage('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Gia hạn gói tập
  const handleRenew = async () => {
    try {
      setLoading(true);
      setMessage('');

      const result = await user.renewPackage();
      setMessage(`✅ ${result.message}`);
      
      // Reload dữ liệu
      await reloadData();
    } catch (error) {
      console.error('Lỗi khi gia hạn:', error);
      setMessage('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="package-registration">
      <h2>🏋️ Đăng Ký Gói Tập</h2>

      {/* Thông tin gói tập hiện tại */}
      {currentPackageInfo && user && (
        <div className="current-package">
          <h3>Gói Tập Hiện Tại</h3>
          <div className="package-info">
            <p><strong>Tên gói:</strong> {currentPackageInfo.PackageName}</p>
            <p><strong>Loại:</strong> {currentPackageInfo.PackageType === 'time' ? 'Theo thời gian' : 'Theo buổi'}</p>
            <p><strong>Ngày hết hạn:</strong> {user.package_end_date?.toLocaleDateString('vi-VN')}</p>
            <p><strong>Số ngày còn lại:</strong> {user.getDaysRemaining()} ngày</p>
            {currentPackageInfo.PackageType === 'session' && (
              <p><strong>Số buổi còn lại:</strong> {user.remaining_sessions}</p>
            )}
            <p><strong>Trạng thái:</strong> {user.isPackageActive() ? '✅ Còn hiệu lực' : '❌ Hết hạn'}</p>
          </div>
          <button 
            onClick={handleRenew} 
            className="btn-renew"
            disabled={loading}
          >
            🔄 Gia Hạn Gói Tập
          </button>
        </div>
      )}

      {/* Danh sách gói tập */}
      <div className="package-list">
        <h3>Chọn Gói Tập Mới</h3>
        <div className="packages-grid">
          {packages.map((pkg) => {
            const finalPrice = pkg.getFinalPrice();
            const hasDiscount = finalPrice < pkg.Price;

            return (
              <div 
                key={pkg.PackageId}
                className={`package-card ${selectedPackage?.PackageId === pkg.PackageId ? 'selected' : ''}`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <h4>{pkg.PackageName}</h4>
                
                {hasDiscount && (
                  <div className="discount-badge">
                    🎉 Giảm {pkg.Discount}%
                  </div>
                )}

                <div className="package-details">
                  <p className="description">{pkg.Description}</p>
                  
                  <div className="price">
                    {hasDiscount && (
                      <span className="original-price">
                        {pkg.Price.toLocaleString('vi-VN')}₫
                      </span>
                    )}
                    <span className="final-price">
                      {finalPrice.toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  <div className="specs">
                    <p>⏰ Thời hạn: {pkg.Duration} ngày</p>
                    {pkg.PackageType === 'session' && (
                      <p>🏋️ Số buổi: {pkg.NumberOfSession}</p>
                    )}
                    <p>📋 Loại: {pkg.PackageType === 'time' ? 'Không giới hạn' : 'Theo buổi'}</p>
                  </div>

                  {pkg.UsageCondition && (
                    <p className="usage-condition">
                      ℹ️ {pkg.UsageCondition}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nút đăng ký */}
      <div className="action-section">
        <button 
          onClick={handleRegister}
          className="btn-register"
          disabled={!selectedPackage || loading}
        >
          {loading ? 'Đang xử lý...' : '✅ Đăng Ký Gói Tập'}
        </button>
      </div>

      {/* Thông báo */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <style jsx>{`
        .package-registration {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .current-package {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          border-left: 4px solid #28a745;
        }

        .package-info p {
          margin: 8px 0;
        }

        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .package-card {
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .package-card:hover {
          border-color: #007bff;
          box-shadow: 0 4px 12px rgba(0,123,255,0.2);
        }

        .package-card.selected {
          border-color: #007bff;
          background: #f0f8ff;
        }

        .discount-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #ff6b6b;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }

        .price {
          margin: 15px 0;
        }

        .original-price {
          text-decoration: line-through;
          color: #999;
          margin-right: 10px;
        }

        .final-price {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
        }

        .specs p {
          margin: 5px 0;
          font-size: 14px;
        }

        .usage-condition {
          margin-top: 10px;
          font-size: 13px;
          color: #666;
          font-style: italic;
        }

        .action-section {
          text-align: center;
          margin: 30px 0;
        }

        .btn-register,
        .btn-renew {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .btn-register:hover:not(:disabled),
        .btn-renew:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-register:disabled,
        .btn-renew:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-renew {
          margin-top: 15px;
          background: #28a745;
        }

        .btn-renew:hover:not(:disabled) {
          background: #218838;
        }

        .message {
          padding: 15px;
          border-radius: 6px;
          margin-top: 20px;
          text-align: center;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
        }
      `}</style>
    </div>
  );
};

export default PackageRegistration;
