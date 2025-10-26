import React, { useEffect, useState } from "react";
import "./DataTableMember.css";
import UserModel from "../../../firebase/lib/features/user/user.model.js";
import DetailMember from "./DetailMember.jsx";
import useDebounce from "../hook/useDebounce.jsx";

export default function DataTableMember() {
    const [stats, setStats] = useState({ total: 0, active: 0, expiring: 0 });
     const [statsLoading, setStatsLoading] = useState(true);
  // State cho phân trang
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // 1. State cho lazy loading
  const [allUsers, setAllUsers] = useState([]); // Danh sách đã tải
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // 2. State cho các giá trị filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); 
  const debouncedSearchQuery = useDebounce(searchQuery, 500); 

    useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      try {
        const fetchedStats = await UserModel.getDashboardStats();
        setStats(fetchedStats);
      } catch (error) {
        console.error("Không thể tải số liệu thống kê:", error);
      }
      setStatsLoading(false);
    }
    fetchStats();
  }, []); 


  // Lấy dữ liệu khi filter thay đổi (server-side search + lazy loading)
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const filters = {
          searchQuery: debouncedSearchQuery,
          status: statusFilter,
        };
        // Reset về trang đầu tiên khi filter thay đổi
        const { users, lastDoc: newLastDoc, hasMore: more } = await UserModel.getAll(filters, 10, null);

        setAllUsers(users); // ghi đè
        setLastDoc(newLastDoc);
        setHasMore(more);
      } catch (err) {
        console.error("Lỗi tải danh sách thành viên:", err);
        setAllUsers([]);
        setLastDoc(null);
        setHasMore(false);
      }
      setLoading(false);
    }
    fetchUsers();
  }, [debouncedSearchQuery, statusFilter]); 


  // Hàm tải thêm user khi bấm nút
  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const filters = {
        searchQuery: debouncedSearchQuery,
        status: statusFilter,
      };
      const { users: newUsers, lastDoc: newLastDoc, hasMore: more } = await UserModel.getAll(filters, 10, lastDoc);
      
      setAllUsers(prev => [...prev, ...newUsers]); // Nối vào danh sách hiện tại
      setLastDoc(newLastDoc);
      setHasMore(more);
    } catch (err) {
      console.error('Lỗi tải thêm user:', err);
    }
    setLoadingMore(false);
  };

  
  const handleView = (user) => {
    setSelectedUser(user);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedUser(null);
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      await UserModel.update(updatedUser._id, updatedUser);

      const updateUserInList = (users) =>
        users.map(user =>
          user._id === updatedUser._id ? { ...user, ...updatedUser } : user
        );

      setAllUsers(prevUsers => updateUserInList(prevUsers));

      setSelectedUser(prev =>
        prev && prev._id === updatedUser._id ? { ...prev, ...updatedUser } : prev
      );
    } catch (error) {
      console.error('Lỗi cập nhật user:', error);
    }
  };


  return (
  <div className="datatable-member-wrapper">
     <div className="stats-cards-container">
        <div className="stat-card">
          <span className="stat-card-number">{statsLoading ? '...' : stats.total}</span>
          <span className="stat-card-label">Tổng hội viên</span>
        </div>
        <div className="stat-card active-card">
          <span className="stat-card-number">{statsLoading ? '...' : stats.active}</span>
          <span className="stat-card-label">Đang hoạt động</span>
        </div>
        <div className="stat-card expiring-card">
          <span className="stat-card-number">{statsLoading ? '...' : stats.expiring}</span>
          <span className="stat-card-label">Sắp hết hạn</span>
        </div>
      </div>
      <div className="filter-user">
        <label>Tìm kiếm:</label>
        <input
          type="text"
          placeholder="Nhập tên hoặc số điện thoại"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Hoạt động</option>
          <option value="about-to-expire">Hết hạn sau 7 ngày</option>
          <option value="Expired">Hết hạn</option>
          
        </select>
      </div>
      <h2 className="datatable-title">Danh sách thành viên</h2>
      <table className="datatable-member">
        <thead>
          <tr>
            <th>Họ và tên</th>
            <th>Ngày sinh</th>
            <th>Ngày đăng ký</th>
            <th>Giới tính</th>
            <th>Số điện thoại</th>
            <th>Gói tập hiện tại</th>
            <th>Ngày hết hạn gói</th>
            <th>Trạng thái gói</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={10} className="datatable-loading">Đang tải...</td></tr>
          ) : allUsers.length === 0 ? (
            <tr><td colSpan={10} className="datatable-empty">Không có thành viên nào phù hợp</td></tr>
          ) : (
            allUsers.map(user => (
              <tr key={user._id} className={user.membership_status === "Active" ? "active" : "inactive"}>
                <td>{user.full_name}</td>
                <td>{user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : ""}</td>
                <td>{user.join_date ? new Date(user.join_date).toLocaleDateString() : ""}</td>
                <td>{user.gender === "male" ? "Nam" : user.gender === "female" ? "Nữ" : "Khác"}</td>
                <td>{user.phone_number}</td>
                
                <td>{user.current_package_id}</td>
                <td>{user.package_end_date ? new Date(user.package_end_date).toLocaleDateString() : ""}</td>
                <td>
                  <span className={user.membership_status === "Active" ? "status-active" : "status-inactive"}>
                    {user.membership_status === "Active" ? "Hoạt động" : user.membership_status === "Expired" ? "Hết hạn" : user.membership_status === "Frozen" ? "Tạm dừng" : "Dùng thử"}
                  </span>
                </td>
                <td>
                  <button className="datatable-btn view" onClick={() => handleView(user)}>Xem chi tiết</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {hasMore && !loading && (
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <button className="datatable-btn" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Đang tải...' : 'Tải thêm'}
          </button>
        </div>
      )}
      <DetailMember user={selectedUser} isOpen={showDetail} onClose={handleCloseDetail} onUpdate={handleUpdateUser} />
    </div>
  );
}