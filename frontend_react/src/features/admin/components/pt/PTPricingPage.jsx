import React, { useState, useEffect } from 'react';
import { useEmployees } from '../../../../firebase/lib/features/employee/employee.provider.jsx';
import { usePT } from '../../../../firebase/lib/features/pt/pt.provider.jsx';
import PTInfoModal from './PTInfoModal.jsx';
import PTPricingModal from './PTPricingModal.jsx';
import './PTPricingPage.css';

export default function PTPricingPage() {
  const { employees, refreshEmployees, loading: employeesLoading } = useEmployees();
  const { 
    getAllPTs, 
    getPTPackages, 
    formatCurrency, 
    loading: ptLoading 
  } = usePT();
  
  const [pts, setPTs] = useState([]);
  const [selectedPT, setSelectedPT] = useState(null);
  const [ptInfoModalOpen, setPTInfoModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Load PTs
  useEffect(() => {
    loadPTs();
  }, []);

  const loadPTs = async () => {
    try {
      await refreshEmployees();
    } catch (error) {
      console.error('Error loading PTs:', error);
    }
  };

  // Filter PTs from all employees
  useEffect(() => {
    if (employees) {
      const ptEmployees = employees.filter(emp => emp.position === 'PT');
      setPTs(ptEmployees);
    }
  }, [employees]);

  // Filter PTs based on search and status
  const filteredPTs = pts.filter(pt => {
    const matchesSearch = pt.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pt.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || pt.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleEditPTInfo = (pt) => {
    setSelectedPT(pt);
    setPTInfoModalOpen(true);
  };

  const handleManagePricing = (pt) => {
    setSelectedPT(pt);
    setPricingModalOpen(true);
  };

  const getPTStats = (pt) => {
    const ptInfo = pt.ptInfo || {};
    return {
      experience: ptInfo.experience || 0,
      rating: ptInfo.rating || 0,
      totalRatings: ptInfo.totalRatings || 0,
      specialties: ptInfo.specialties || [],
      isAcceptingNewClients: ptInfo.isAcceptingNewClients !== false
    };
  };

  if (employeesLoading || ptLoading) {
    return (
      <div className="pt-pricing-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu PT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-pricing-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Quản Lý PT & Giá Dịch Vụ</h1>
          <p>Quản lý thông tin PT và thiết lập giá các gói tập luyện</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box-ptmanagement">
          <input
            type="text"
            placeholder="Tìm kiếm PT theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm nghỉ</option>
            <option value="resigned">Đã nghỉ việc</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{filteredPTs.length}</h3>
            <p>Tổng số PT</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{filteredPTs.filter(pt => pt.status === 'active').length}</h3>
            <p>Đang hoạt động</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>{filteredPTs.filter(pt => getPTStats(pt).rating >= 4.5).length}</h3>
            <p>Rating ≥ 4.5</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <h3>{filteredPTs.filter(pt => getPTStats(pt).isAcceptingNewClients).length}</h3>
            <p>Nhận khách mới</p>
          </div>
        </div>
      </div>

      {/* PT List */}
      <div className="pts-grid">
        {filteredPTs.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>Không tìm thấy PT nào</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          filteredPTs.map((pt) => {
            const stats = getPTStats(pt);
            
            return (
              <div key={pt._id} className="pt-card">
                {/* Avatar & Basic Info */}
                <div className="pt-header">
                  <div className="pt-avatar">
                    {pt.avatarUrl ? (
                      <img 
                        src={pt.avatarUrl.startsWith('http') ? pt.avatarUrl : `http://localhost:3000${pt.avatarUrl}`} 
                        alt={pt.fullName}
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {pt.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-basic-info">
                    <h3>{pt.fullName}</h3>
                    <p className="pt-email">{pt.email}</p>
                    <div className="pt-status-badges">
                      <span className={`status-badge ${pt.status}`}>
                        {pt.status === 'active' ? 'Hoạt động' : 
                         pt.status === 'inactive' ? 'Tạm nghỉ' : 
                         pt.status === 'resigned' ? 'Đã nghỉ' : pt.status}
                      </span>
                      {stats.isAcceptingNewClients && (
                        <span className="status-badge accepting">Nhận khách mới</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* PT Stats */}
                <div className="pt-stats">
                  <div className="stat-item">
                    <span className="stat-label">Kinh nghiệm:</span>
                    <span className="stat-value">{stats.experience} năm</span>
                  </div>
                  
                  {stats.rating > 0 && (
                    <div className="stat-item">
                      <span className="stat-label">Đánh giá:</span>
                      <span className="stat-value">
                        ⭐ {stats.rating.toFixed(1)} ({stats.totalRatings})
                      </span>
                    </div>
                  )}
                  
                  <div className="stat-item">
                    <span className="stat-label">Khách hàng:</span>
                    <span className="stat-value">{pt.totalClients || 0}</span>
                  </div>
                </div>

                {/* Specialties */}
                {stats.specialties.length > 0 && (
                  <div className="pt-specialties">
                    <div className="specialties-label">Chuyên môn:</div>
                    <div className="specialties-tags">
                      {stats.specialties.slice(0, 3).map((specialty, index) => (
                        <span key={index} className="specialty-tag">
                          {specialty}
                        </span>
                      ))}
                      {stats.specialties.length > 3 && (
                        <span className="specialty-tag more">
                          +{stats.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => handleEditPTInfo(pt)}
                  >
                    <span className="icon">👤</span>
                    Thông tin PT
                  </button>
                  
                  <button 
                    className="btn-primary"
                    onClick={() => handleManagePricing(pt)}
                  >
                    <span className="icon">💰</span>
                    Quản lý giá
                  </button>
                </div>

                {/* Quick Actions - DISABLED */}
                {/*
                <div className="pt-quick-actions">
                  <button 
                    className="quick-action-btn"
                    onClick={() => handleCreateDefaultPackages(pt)}
                    title="Tạo gói mặc định"
                  >
                    <span className="icon">⚡</span>
                    Gói mặc định
                  </button>
                </div>
                */}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <PTInfoModal
        isOpen={ptInfoModalOpen}
        onClose={() => {
          setPTInfoModalOpen(false);
          setSelectedPT(null);
        }}
        pt={selectedPT}
        onUpdate={() => {
          loadPTs(); // Refresh data
        }}
      />

      <PTPricingModal
        isOpen={pricingModalOpen}
        onClose={() => {
          setPricingModalOpen(false);
          setSelectedPT(null);
        }}
        ptId={selectedPT?._id}
        onUpdate={() => {
          // Refresh PT packages if needed
        }}
      />
    </div>
  );
}