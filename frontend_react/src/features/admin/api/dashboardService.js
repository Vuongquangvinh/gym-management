import axios from 'axios';

const mock = () => ({
  activeMembers: 1248,
  todayCheckins: 324,
  openPackages: 52,
  revenueM: 120,
  recent: [
    'Nguyễn A đã check-in — 10 phút trước',
    'Trần B đã check-in — 35 phút trước',
    'Phạm C đã check-in — 1 giờ trước'
  ],
  series: [12,19,8,24,16,20,28]
});

export async function fetchDashboard(){
  try {
    const res = await axios.get('/api/admin/dashboard');
    return res.data;
  } catch (e) {
    return new Promise((r)=> setTimeout(()=> r(mock()), 300));
  }
}
