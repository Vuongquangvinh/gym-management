import React, { useEffect, useMemo, useState } from 'react';
import './checkins.css';
import './CheckinsModal.css'; // Đảm bảo file CSS được import
import { useCheckins } from '../../../firebase/lib/features/checkin/checkin.provier.jsx';
import { fetchAllMembers } from '../../../firebase/lib/features/checkin/checkin.service.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function fmtTime(d) {
  try {
    if (!d) return '-';

    let date;
    if (d instanceof Date) {
      date = d;
    } else if (d?.toDate) {
      date = d.toDate(); // Firestore Timestamp
    } else if (typeof d === 'string') {
      date = new Date(d); // String
    } else if (d?.seconds && d?.nanoseconds) {
      date = new Date(d.seconds * 1000 + d.nanoseconds / 1000000); // Firestore Timestamp
    } else {
      console.warn('Unrecognized date format:', d);
      return '-';
    }

    if (isNaN(date.getTime())) {
      console.warn('Invalid Date:', d);
      return '-';
    }

    return date.toLocaleString();
  } catch (e) {
    console.error('Error formatting time:', e);
    return '-';
  }
}

export default function Checkins() {
  const [q, setQ] = useState('');
  const [range, setRange] = useState('today'); // today | 7d | all
  const [onlyQR, setOnlyQR] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddCheckin, setShowAddCheckin] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [checkinTime, setCheckinTime] = useState(new Date());
  const [searchMember, setSearchMember] = useState(''); // Thêm chức năng tìm kiếm hội viên

  const { items, loading, error, fetchMore, members, addCheckin } = useCheckins();

  const filteredMembers = useMemo(() => {
    if (!searchMember.trim()) return [];
    const searchTerm = searchMember.toLowerCase();
    return members.filter(member => {
      const haystack = `${member.full_name ?? ''} ${member.phone_number ?? ''}`.toLowerCase();
      return haystack.includes(searchTerm);
    });
  }, [searchMember, members]);

  const filtered = useMemo(() => {
    const now = Date.now();

    return items.filter(item => {
      if (q.trim()) {
        const searchTerm = q.toLowerCase();
        const haystack = `${item.memberName ?? ''} ${item.memberId ?? ''}`.toLowerCase();
        if (!haystack.includes(searchTerm)) {
          console.log('Filtered out by search term:', item);
          return false;
        }
      }
      if (onlyQR && item.source !== 'QR') {
        console.log('Filtered out by onlyQR:', item);
        return false;
      }
      if (selectedDate) {
        const itemDate = new Date(item.checkedAt);
        const filterDate = new Date(selectedDate);
        if (
          itemDate.getDate() !== filterDate.getDate() ||
          itemDate.getMonth() !== filterDate.getMonth() ||
          itemDate.getFullYear() !== filterDate.getFullYear()
        ) {
          console.log('Filtered out by selectedDate:', item);
          return false;
        }
      } else if (range === 'today') {
        console.log('Raw checkedAt value:', item.checkedAt);
        let d;
        if (item.checkedAt instanceof Date) {
          d = item.checkedAt;
        } else if (item.checkedAt?.toDate) {
          d = item.checkedAt.toDate(); // Chuyển đổi từ Firestore Timestamp
        } else if (typeof item.checkedAt === 'string') {
          d = new Date(item.checkedAt); // Chuyển đổi từ chuỗi ngày
        } else if (item.checkedAt?.seconds && item.checkedAt?.nanoseconds) {
          d = new Date(item.checkedAt.seconds * 1000 + item.checkedAt.nanoseconds / 1000000); // Chuyển đổi từ Firestore Timestamp
        } else {
          console.log('Invalid checkedAt format:', item.checkedAt);
          return false;
        }

        if (isNaN(d.getTime())) {
          console.log('Invalid Date after conversion:', item.checkedAt);
          return false;
        }

        if (!(d && d.toDateString && d.toDateString() === new Date().toDateString())) {
          console.log('Filtered out by range=today:', item);
          return false;
        }
      }
      if (range === '7d') {
        if ((now - new Date(item.checkedAt).getTime()) > 1000 * 60 * 60 * 24 * 7) {
          console.log('Filtered out by range=7d:', item);
          return false;
        }
      }
      return true;
    }).sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt));
  }, [q, range, onlyQR, selectedDate, items]);


  const totalToday = useMemo(() => items.filter(i => {
    const d = new Date(i.checkedAt);
    return d && d.toDateString ? d.toDateString() === new Date().toDateString() : false;
  }).length, [items]);



  useEffect(() => {
    if (showAddCheckin) {
      console.log('Modal opened: Fetching members...');
      fetchAllMembers()
        .then(fetchedMembers => {
          console.log('Fetched members:', fetchedMembers);
        })
        .catch(error => {
          console.error('Error fetching members:', error);
        });
    }
  }, [showAddCheckin]);

  useEffect(() => {
    console.log('Checkins items:', items);
    console.log('Filtered checkins:', filtered);
  }, [items, filtered]);

  useEffect(() => {
    if (!showAddCheckin) {
      setSelectedMember('');
      setCheckinTime(new Date());
      setSearchMember('');
    }
  }, [showAddCheckin]);


  const handleAddCheckin = async () => {
    if (!selectedMember) {
      toast.error('Vui lòng chọn hội viên trước khi lưu.');
      return;
    }
    if (!checkinTime) {
      toast.error('Vui lòng chọn giờ vào trước khi lưu.');
      return;
    }

    try {
      const payload = {
        memberId: selectedMember.id,
        memberName: selectedMember.full_name,
        checkedAt: checkinTime,
        source: 'manual',
      };
      console.log('Thêm check-in với payload:', payload);
      await addCheckin(payload);
      toast.success('Check-in thành công!');
      setShowAddCheckin(false);
    } catch (error) {
      toast.error('Lỗi khi thêm check-in. Vui lòng thử lại.');
    }
  };

  const handleCloseModal = () => {
    setShowAddCheckin(false);
    setSelectedMember('');
    setCheckinTime(new Date());
    setSearchMember('');
  };

  return (
    <div className="checkins-root">
      <ToastContainer />
      <div className="checkins-header">
        <div>
          <h3 className="checkins-title">Check-ins</h3>
          <div className="muted">Quản lý lịch sử check-in, realtime-ready</div>
        </div>

        <div className="checkins-actions">
          <div className="live-indicator">
            <span className="live-dot" />
            <span className="muted">Live</span>
          </div>
          <button className="btn add-checkin" onClick={() => setShowAddCheckin(true)}>+ Thêm check-in</button>
        </div>
      </div>

      {showAddCheckin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4 className="modal-title">Thêm Check-in</h4>
            <div className="modal-body">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm hội viên..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                />
                {filteredMembers.length > 0 && (
                  <ul className="search-results">
                    {filteredMembers.map(member => (
                      <li
                        key={member.id}
                        className="search-result-item"
                        onClick={() => {
                          setSelectedMember(member);
                          setSearchMember('');
                        }}
                      >
                        <div className="member-info">
                          <strong>{member.full_name} - {member.phone_number}</strong>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedMember && (
                <div className="selected-member">
                  <h5>Thông tin hội viên</h5>
                  <p><strong>Tên:</strong> {selectedMember.full_name}</p>
                  <p><strong>Số điện thoại:</strong> {selectedMember.phone_number}</p>
                </div>
              )}

              <label className="time-label">Giờ vào:</label>
              <DatePicker
                selected={checkinTime}
                onChange={(date) => setCheckinTime(date)}
                showTimeSelect
                dateFormat="Pp"
                className="time-picker"
              />
            </div>

            <div className="modal-actions">
              <button className="btn save-btn" onClick={handleAddCheckin}>Lưu</button>
              <button className="btn cancel-btn" onClick={handleCloseModal}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      <div className="card checkins-card">
        <div className="checkins-controls">
          <div className="controls-left">
            <input className="input-search" placeholder="Tìm kiếm theo tên hoặc gói" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="select-range" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="today">Hôm nay</option>
              <option value="7d">7 ngày</option>
              <option value="all">Tất cả</option>
            </select>
            <label className="checkbox-label"><input type="checkbox" checked={onlyQR} onChange={(e) => setOnlyQR(e.target.checked)} /> Chỉ QR</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              className="input-date"
              placeholderText="Chọn ngày"
            />
          </div>

          <div className="controls-right">
            <div className="muted">Check-ins hôm nay</div>
            <div className="today-count">{totalToday}</div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="checkins-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Package</th>
                <th>Time</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="no-result">
                    {loading ? 'Đang tải...' : selectedDate ? `Không có check-in nào vào ngày ${selectedDate.toLocaleDateString()}` : 'Không có kết quả'}
                  </td>
                </tr>
              )}
              {filtered.map(item => (
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

                  <td><span className={`source-badge ${item.source === 'QR' ? 'qr' : 'manual'}`}>{item.source}</span></td>

                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn outline" onClick={() => alert('Xem chi tiết: ' + item.memberName)}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          {loading ? (
            <div className="spinner" />
          ) : (
            <button className="btn outline" onClick={async () => {
              try {
                await fetchMore();
              } catch (e) { alert('Load more failed'); }
            }}>Load more</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* CSS in JS for modal adjustments */
const style = {
  modalBodySelectedMember: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  modalBodySelectedMemberP: {
    margin: 0,
    padding: '5px 0',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
};

Object.keys(style).forEach(key => {
  const className = key.replace(/([A-Z])/g, '-$1').toLowerCase();
  const rules = style[key];
  const styleSheet = document.styleSheets[0];
  const rule = `.${className} { ${Object.entries(rules).map(([prop, value]) => `${prop}: ${value};`).join(' ')} }`;
  styleSheet.insertRule(rule, styleSheet.cssRules.length);
});
