import React from 'react';
import DataTableMember from '../components/DataTableMember.jsx';

export default function Members() {
  // Dummy handlers for now
  const handleEdit = (user) => alert('Sửa: ' + user.name);
  const handleDisable = (user) => alert((user.isActive ? 'Vô hiệu hóa: ' : 'Kích hoạt: ') + user.name);
  const handleView = (user) => alert('Xem chi tiết: ' + user.name);

  return (
    <div className="card">
      <DataTableMember onEdit={handleEdit} onDisable={handleDisable} onView={handleView} />
    </div>
  );
}
