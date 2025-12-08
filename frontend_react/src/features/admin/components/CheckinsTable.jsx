import React, { memo } from 'react';
import PropTypes from 'prop-types';

const CheckinsTable = memo(function CheckinsTable({ 
  items, 
  loading,
  selectedDate,
  onViewDetail,
  onLoadMore 
}) {
  if (items.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="no-result">
          {loading ? 'Đang tải...' : selectedDate 
            ? `Không có check-in nào vào ngày ${selectedDate.toLocaleDateString()}` 
            : 'Không có kết quả'}
        </td>
      </tr>
    );
  }

  return (
    <>
      {items.map(item => (
        <tr key={item.id}>
          <td>
            <div className="member-cell">
              <div className="member-avatar">{item.memberName[0]}</div>
              <div>
                <div className="member-name">{item.memberName}</div>
                <div className="muted" style={{ fontSize: 12 }}></div>
              </div>
            </div>
          </td>
          
          <td>{item.packageName}</td>
          
          <td>{item.checkedAt?.seconds && item.checkedAt?.nanoseconds
            ? new Date(item.checkedAt.seconds * 1000 + item.checkedAt.nanoseconds / 1000000).toLocaleString()
            : 'Không xác định'}</td>
          
          <td>
            <span className={`source-badge ${item.source === 'QR' ? 'qr' : 'manual'}`}>
              {item.source}
            </span>
          </td>
          
          <td>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn outline" 
                onClick={() => onViewDetail(item)}
              >
                View
              </button>
            </div>
          </td>
        </tr>
      ))}
      
      <tr>
        <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
          {loading ? (
            <div className="spinner" />
          ) : (
            <button className="btn outline" onClick={onLoadMore}>
              Load more
            </button>
          )}
        </td>
      </tr>
    </>
  );
});

CheckinsTable.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  selectedDate: PropTypes.instanceOf(Date),
  onViewDetail: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired
};

export default CheckinsTable;
