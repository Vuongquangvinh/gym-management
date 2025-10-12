import React, { useEffect, useState } from "react";
import "./DataTableMember.css";
import UserModel from "../../../firebase/lib/features/user/user.model.js";

export default function DataTableMember({ onEdit, onDisable, onView }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const data = await UserModel.getAll({ limit: 50 });
        setUsers(data);
      } catch (err) {
        console.error("Lỗi tải danh sách thành viên:", err);
        setUsers([]);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  return (
    <div className="datatable-member-wrapper">
      <h2 className="datatable-title">Danh sách thành viên</h2>
      <table className="datatable-member">
        <thead>
          <tr>
            <th>Email</th>
            <th>Tên</th>
            <th>Ngày sinh</th>
            <th>Số điện thoại</th>
            <th>Gói tập</th>
            <th>Ngày hết hạn</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="datatable-loading">Đang tải...</td></tr>
          ) : users.length === 0 ? (
            <tr><td colSpan={9} className="datatable-empty">Không có thành viên nào</td></tr>
          ) : (
            users.map(user => (
              <tr key={user.id} className={user.isActive ? "active" : "inactive"}>
                <td>{user.email}</td>
                <td>{user.name}</td>
                <td>{user.dob ? new Date(user.dob).toLocaleDateString() : ""}</td>
                <td>{user.phone}</td>
                <td>{user.packageId}</td>
                <td>{user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : ""}</td>
                <td>{user.role}</td>
                <td>
                  <span className={user.isActive ? "status-active" : "status-inactive"}>
                    {user.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                  </span>
                </td>
                <td>
                  <button className="datatable-btn view" onClick={() => onView(user)}>Xem</button>
                  <button className="datatable-btn edit" onClick={() => onEdit(user)}>Sửa</button>
                  <button className="datatable-btn disable" onClick={() => onDisable(user)}>
                    {user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
