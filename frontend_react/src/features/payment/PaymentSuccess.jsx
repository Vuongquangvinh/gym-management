import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Đang xử lý thanh toán...');

  useEffect(() => {
    const confirmPayment = async () => {
      // Get orderCode from URL params
      const orderCode = searchParams.get('orderCode');
      const cancel = searchParams.get('cancel');
      const status = searchParams.get('status');

      // Check if payment was cancelled
      if (cancel === 'true' || status === 'CANCELLED') {
        setStatus('error');
        setMessage('Thanh toán đã bị hủy');
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
        return;
      }

      if (!orderCode) {
        setStatus('error');
        setMessage('Không tìm thấy thông tin đơn hàng');
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
        return;
      }

      try {
        // Call confirm API to update user package
        console.log('🔔 Confirming payment for order:', orderCode);
        
        const response = await fetch('/api/payos/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderCode: parseInt(orderCode) }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage('Thanh toán thành công! Gói tập đã được cập nhật.');
          
          // Redirect to admin page after 2 seconds
          setTimeout(() => {
            navigate('/admin', { replace: true });
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Có lỗi xảy ra khi xác nhận thanh toán');
          
          setTimeout(() => {
            navigate('/admin');
          }, 3000);
        }
      } catch (error) {
        console.error('Error confirming payment:', error);
        setStatus('error');
        setMessage('Có lỗi xảy ra: ' + error.message);
        
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Đang xử lý...</h2>
            <p style={{ color: '#666' }}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '40px',
              color: 'white'
            }}>
              ✓
            </div>
            <h2 style={{ color: '#4CAF50', marginBottom: '10px' }}>Thành công!</h2>
            <p style={{ color: '#666' }}>{message}</p>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>
              Đang chuyển hướng...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f44336',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '40px',
              color: 'white'
            }}>
              ✕
            </div>
            <h2 style={{ color: '#f44336', marginBottom: '10px' }}>Có lỗi xảy ra</h2>
            <p style={{ color: '#666' }}>{message}</p>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>
              Đang chuyển hướng về trang quản lý...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
