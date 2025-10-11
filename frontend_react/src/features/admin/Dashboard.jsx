import React from 'react';
import SmallChart from './components/SmallChart';
import ChartCard from './components/ChartCard';
import { fetchDashboard } from './api/dashboardService';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(()=>{ fetchDashboard().then(setData); }, []);
  return (
    <div className="dashboard-root">
      <div className="dash-header">
        <h2>Dashboard</h2>
        <p className="muted">Tổng quan phòng tập</p>
      </div>

      <div className="grid">
        <div className="card stat">
          <h3>Active Members</h3>
          <div className="big">{data ? data.activeMembers : '—'}</div>
          <SmallChart data={data?.series} />
        </div>

        <div className="card stat">
          <h3>Today Check-ins</h3>
          <div className="big">324</div>
        </div>

        <div className="card stat">
          <h3>Open Packages</h3>
          <div className="big">52</div>
        </div>

        <div className="card stat">
          <h3>Revenue (M)</h3>
          <div className="big">120</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h4>Recent Check-ins</h4>
          <ul className="activity">
            {(data?.recent ?? []).map((t,i)=>(<li key={i}>{t}</li>))}
          </ul>
        </div>

        <div className="card">
          <h4>Quick Actions</h4>
          <div className="actions">
            <button className="btn">Tạo member</button>
            <button className="btn outline">Tạo gói</button>
            <button className="btn" onClick={()=> alert('Mở quét QR (mô phỏng)')}>Quét QR</button>
          </div>
        </div>
      </div>

      <div style={{marginTop:18}}>
        <ChartCard data={data?.series} />
      </div>
    </div>
  );
}
