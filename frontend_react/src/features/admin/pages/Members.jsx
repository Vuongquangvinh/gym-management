import React from 'react';
import DataTableMember from '../components/DataTableMember.jsx';

export default function Members() {
  // Dummy handlers for now
  const handleEdit = (user) => alert('Sửa: ' + user.full_name);
  const handleDisable = (user) => alert((user.membership_status === 'Active' ? 'Vô hiệu hóa: ' : 'Kích hoạt: ') + user.full_name);

  return (
    
    <div className="card">
      
      <DataTableMember onEdit={handleEdit} onDisable={handleDisable} />
    </div>
  );
}
