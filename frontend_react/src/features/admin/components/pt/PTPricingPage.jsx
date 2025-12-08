import React, { useState, useEffect } from 'react';
import { useEmployees } from '../../../../firebase/lib/features/employee/employee.provider.jsx';
import { usePT } from '../../../../firebase/lib/features/pt/pt.provider.jsx';
import PTInfoModal from './PTInfoModal.jsx';
import PTPricingModal from './PTPricingModal.jsx';
import styles from './PTPricingPage.module.css';

export default function PTPricingPage() {
  const { employees, refreshEmployees, loading: employeesLoading, loadingMore, hasMore, fetchMore } = useEmployees();
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

  // Filter PTs from all employees (automatic from provider)
  useEffect(() => {
    console.log('🔍 [PTPricingPage] Employees loaded:', employees?.length);
    if (employees && employees.length > 0) {
      const ptEmployees = employees.filter(emp => emp.position === 'PT');
      console.log('🔍 [PTPricingPage] PT employees found:', ptEmployees.length);
      setPTs(ptEmployees);
    } else {
      console.log('⚠️ [PTPricingPage] No employees yet');
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
      <div className={styles.ptPricingPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải dữ liệu PT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ptPricingPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1>Quản Lý PT & Giá Dịch Vụ</h1>
          <p>Quản lý thông tin PT và thiết lập giá các gói tập luyện</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBoxPtmanagement}>
          <input
            type="text"
            placeholder="Tìm kiếm PT theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.filterControls}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm nghỉ</option>
            <option value="resigned">Đã nghỉ việc</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsSummary}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3>{filteredPTs.length}</h3>
            <p>Tổng số PT</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>{filteredPTs.filter(pt => pt.status === 'active').length}</h3>
            <p>Đang hoạt động</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statInfo}>
            <h3>{filteredPTs.filter(pt => getPTStats(pt).rating >= 4.5).length}</h3>
            <p>Rating ≥ 4.5</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statInfo}>
            <h3>{filteredPTs.filter(pt => getPTStats(pt).isAcceptingNewClients).length}</h3>
            <p>Nhận khách mới</p>
          </div>
        </div>
      </div>

      {/* PT List */}
      <div className={styles.ptsGrid}>
        {filteredPTs.length === 0 ? (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>🔍</div>
            <h3>Không tìm thấy PT nào</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          filteredPTs.map((pt) => {
            const stats = getPTStats(pt);
            
            return (
              <div key={pt._id} className={styles.ptCard}>
                {/* Avatar & Basic Info */}
                <div className={styles.ptHeaderAdmin}>
                  <div className={styles.ptAvatar}>
                    {pt.avatarUrl ? (
                      <img 
                        src={pt.avatarUrl.startsWith('http') ? pt.avatarUrl : `http://localhost:3000${pt.avatarUrl}`} 
                        alt={pt.fullName}
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {pt.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.ptBasicInfo}>
                    <h3>{pt.fullName}</h3>
                    <p className={styles.ptEmail}>{pt.email}</p>
                    <div className={styles.ptStatusBadges}>
                      <span className={`${styles.statusBadge} ${styles[pt.status]}`}>
                        {pt.status === 'active' ? 'Hoạt động' : 
                         pt.status === 'inactive' ? 'Tạm nghỉ' : 
                         pt.status === 'resigned' ? 'Đã nghỉ' : pt.status}
                      </span>
                      {stats.isAcceptingNewClients && (
                        <span className={`${styles.statusBadge} ${styles.accepting}`}>Nhận khách mới</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* PT Stats */}
                <div className={styles.ptStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Kinh nghiệm:</span>
                    <span className={styles.statValue}>{stats.experience} năm</span>
                  </div>
                  
                  {stats.rating > 0 && (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Đánh giá:</span>
                      <span className={styles.statValue}>
                        ⭐ {stats.rating.toFixed(1)} ({stats.totalRatings})
                      </span>
                    </div>
                  )}
                  
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Khách hàng:</span>
                    <span className={styles.statValue}>{pt.totalClients || 0}</span>
                  </div>
                </div>

                {/* Specialties */}
                {stats.specialties.length > 0 && (
                  <div className={styles.ptSpecialties}>
                    <div className={styles.specialtiesLabel}>Chuyên môn:</div>
                    <div className={styles.specialtiesTags}>
                      {stats.specialties.slice(0, 3).map((specialty, index) => (
                        <span key={index} className={styles.specialtyTag}>
                          {specialty}
                        </span>
                      ))}
                      {stats.specialties.length > 3 && (
                        <span className={`${styles.specialtyTag} ${styles.more}`}>
                          +{stats.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.ptActions}>
                  <button 
                    className={styles.btnSecondary}
                    onClick={() => handleEditPTInfo(pt)}
                  >
                    <span className={styles.icon}>👤</span>
                    Thông tin PT
                  </button>
                  
                  <button 
                    className={styles.btnPrimary}
                    onClick={() => handleManagePricing(pt)}
                  >
                    <span className={styles.icon}>💰</span>
                    Quản lý dịch vụ
                  </button>
                </div>

               
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

      {/* Load More Button */}
      {!employeesLoading && hasMore && filteredPTs.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '32px',
          marginTop: '24px'
        }}>
          <button
            onClick={fetchMore}
            disabled={loadingMore}
            style={{
              padding: '14px 40px',
              background: loadingMore ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loadingMore ? 'none' : '0 6px 16px rgba(102, 126, 234, 0.4)',
              transform: loadingMore ? 'none' : 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              if (!loadingMore) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingMore) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            {loadingMore ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                {' '}Đang tải thêm PT...
              </>
            ) : (
              <>📄 Tải thêm PT</>
            )}
          </button>
        </div>
      )}

      {/* Show total loaded */}
      {!employeesLoading && filteredPTs.length > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          color: '#999',
          fontSize: '14px',
          fontWeight: 500
        }}>
          Đã hiển thị {filteredPTs.length} PT{hasMore ? ` • Còn nhiều hơn nữa` : ''}
        </div>
      )}
    </div>
  );
}
