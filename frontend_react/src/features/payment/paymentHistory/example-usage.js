// Example usage in App.jsx or Router
import PaymentHistory from "@/features/payment/paymentHistory";

// Add to routes
const routes = [
  {
    path: "/payment-history",
    element: <PaymentHistory />,
    name: "Lịch sử thanh toán",
    icon: <ReceiptLongIcon />,
  },
];

export default routes;
