import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Button,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PaymentOrderModel } from "../../../firebase/lib/features/payment";
import styles from './revenueChart.module.css';

const RevenueChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [viewMode, setViewMode] = useState("day"); // 'day' or 'month'
  const [chartType, setChartType] = useState("bar"); // 'bar', 'line', 'area'
  const [stats, setStats] = useState(null);

  // Load data
  const loadChartData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Loading chart data for mode:", viewMode);

      let data = [];
      
      if (viewMode === "day") {
        // Load 30 ngày gần đây
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        console.log("📅 Loading daily data from", startDate, "to", endDate);
        data = await PaymentOrderModel.getRevenueByDay(startDate, endDate);
        console.log("✅ Loaded daily revenue data:", data.length, "records");
        console.log("📊 Sample data:", data.slice(0, 3));
      } else {
        // Load theo tháng của năm hiện tại
        const currentYear = new Date().getFullYear();
        console.log("📅 Loading monthly data for year:", currentYear);
        data = await PaymentOrderModel.getRevenueByMonth(currentYear);
        console.log("✅ Loaded monthly revenue data:", data.length, "records");
        console.log("📊 Sample data:", data.slice(0, 3));
      }

      // Format data cho Recharts
      const formattedData = data.map(item => ({
        name: viewMode === "day" 
          ? new Date(item.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
          : `Tháng ${item.month.split("-")[1]}`,
        date: item.date || item.month,
        revenue: item.revenue,
        orders: item.orders,
        revenueInMillions: (item.revenue / 1000000).toFixed(1), // Để hiển thị dễ đọc
      }));

      console.log("📈 Formatted chart data:", formattedData.length, "records");
      setChartData(formattedData);

      // Calculate stats
      const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
      const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
      const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;

      setStats({
        totalRevenue,
        totalOrders,
        avgRevenue,
        periodCount: data.length,
      });

      console.log("✅ Chart loaded successfully");

    } catch (err) {
      console.error("❌ Load chart data error:", err);
      console.error("Error stack:", err.stack);
      setError(`Không thể tải dữ liệu biểu đồ: ${err.message}`);
      // Set empty data to show empty state
      setChartData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper 
          elevation={6} 
          sx={{ 
            p: 2.5, 
            bgcolor: "rgba(255, 255, 255, 0.98)",
            borderRadius: 3,
            border: "2px solid",
            borderColor: "primary.light",
            backdropFilter: "blur(10px)",
            minWidth: 200
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main" sx={{ mb: 1.5 }}>
            📅 {payload[0].payload.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#1976d2" }} />
            <Typography variant="body2" fontWeight="medium" color="text.primary">
              Doanh thu:
            </Typography>
          </Box>
          <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ ml: 2.5, mb: 1.5 }}>
            {formatCurrency(payload[0].payload.revenue)}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#00897B" }} />
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Đơn hàng: <strong>{payload[0].payload.orders}</strong>
            </Typography>
          </Box>
        </Paper>
      );
    }
    return null;
  };

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1976d2" />
                <stop offset="100%" stopColor="#42a5f5" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="5 5" stroke="#e0e0e0" strokeOpacity={0.5} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 13, fill: "#546E7A", fontWeight: 500 }}
              stroke="#90A4AE"
              axisLine={{ strokeWidth: 2 }}
            />
            <YAxis 
              tick={{ fontSize: 13, fill: "#546E7A", fontWeight: 500 }}
              stroke="#90A4AE"
              axisLine={{ strokeWidth: 2 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#1976d2", strokeWidth: 2, strokeDasharray: "5 5" }} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              name="Doanh thu"
              stroke="url(#lineGradient)" 
              strokeWidth={4}
              dot={{ fill: "#1976d2", r: 5, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 8, strokeWidth: 3, stroke: "#fff", fill: "#1976d2" }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.9}/>
                <stop offset="50%" stopColor="#42a5f5" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#90caf9" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="5 5" stroke="#e0e0e0" strokeOpacity={0.5} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 13, fill: "#546E7A", fontWeight: 500 }}
              stroke="#90A4AE"
              axisLine={{ strokeWidth: 2 }}
            />
            <YAxis 
              tick={{ fontSize: 13, fill: "#546E7A", fontWeight: 500 }}
              stroke="#90A4AE"
              axisLine={{ strokeWidth: 2 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#1976d2", strokeWidth: 2, strokeDasharray: "5 5" }} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              name="Doanh thu"
              stroke="#1976d2" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorRevenue)"
              dot={{ fill: "#1976d2", r: 4, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 7, strokeWidth: 3, stroke: "#fff" }}
            />
          </AreaChart>
        );

      default: // bar
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1976d2" />
                <stop offset="100%" stopColor="#42a5f5" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="5 5" stroke="#e0e0e0" strokeOpacity={0.5} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 13, fill: "#546E7A", fontWeight: 500 }}
              stroke="#90A4AE"
              axisLine={{ strokeWidth: 2 }}
            />
            <YAxis 
              tick={{ fontSize: 13, fill: "#546E7A", fontWeight: 500 }}
              stroke="#90A4AE"
              axisLine={{ strokeWidth: 2 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(25, 118, 210, 0.05)" }} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
            <Bar 
              dataKey="revenue" 
              name="Doanh thu"
              fill="url(#barGradient)"
              radius={[12, 12, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        );
    }
  };

  if (loading) {
    return (
      <Card 
        sx={{ 
          borderRadius: 4,
          overflow: "hidden",
          background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <CardContent>
          <Box 
            display="flex" 
            flexDirection="column"
            justifyContent="center" 
            alignItems="center" 
            minHeight={500}
            gap={3}
          >
            <CircularProgress size={56} thickness={4} sx={{ color: "#1976d2" }} />
            <Box textAlign="center">
              <Typography variant="h6" fontWeight="medium" color="primary.main" gutterBottom>
                Đang tải dữ liệu biểu đồ...
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Vui lòng đợi trong giây lát
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4} 
        flexWrap="wrap" 
        gap={2}
        sx={{
          p: 2.5,
          background: "linear-gradient(135deg, rgba(13, 71, 161, 0.05) 0%, rgba(255, 255, 255, 0.8) 100%)",
          borderRadius: 3,
          backdropFilter: "blur(10px)",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            }}
          >
            <Typography variant="h5" sx={{ color: "white" }}>📈</Typography>
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              Biểu đồ doanh thu
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Theo dõi xu hướng và hiệu suất kinh doanh
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          {/* Chart Type Toggle */}
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, newType) => newType && setChartType(newType)}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.08)",
                  transform: "translateY(-2px)",
                },
                "&.Mui-selected": {
                  backgroundColor: "#1976d2",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#1565c0",
                  },
                },
              },
            }}
          >
            <ToggleButton value="bar">
              📊 Cột
            </ToggleButton>
            <ToggleButton value="line">
              📈 Đường
            </ToggleButton>
            <ToggleButton value="area">
              🌊 Vùng
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Time Period Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                textTransform: "none",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(0, 137, 123, 0.08)",
                  transform: "translateY(-2px)",
                },
                "&.Mui-selected": {
                  backgroundColor: "#00897B",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#00695C",
                  },
                },
              },
            }}
          >
            <ToggleButton value="day">
              <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
              30 ngày
            </ToggleButton>
            <ToggleButton value="month">
              <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
              12 tháng
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 3,
            boxShadow: "0 4px 12px rgba(244, 67, 54, 0.2)",
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadChartData}
              sx={{ fontWeight: 600 }}
            >
              Thử lại
            </Button>
          }
        >
          <Typography variant="body2" fontWeight="medium">
            {error}
          </Typography>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { 
              label: "Tổng doanh thu", 
              value: formatCurrency(stats.totalRevenue),
              icon: "💰",
              gradient: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              shadow: "0 8px 24px rgba(25, 118, 210, 0.3)"
            },
            { 
              label: "Tổng đơn hàng", 
              value: stats.totalOrders,
              icon: "📦",
              gradient: "linear-gradient(135deg, #00897B 0%, #26A69A 100%)",
              shadow: "0 8px 24px rgba(0, 137, 123, 0.3)"
            },
            { 
              label: `Trung bình/${viewMode === "day" ? "ngày" : "tháng"}`, 
              value: formatCurrency(stats.avgRevenue),
              icon: "📊",
              gradient: "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
              shadow: "0 8px 24px rgba(76, 175, 80, 0.3)"
            },
            { 
              label: "Có dữ liệu", 
              value: `${stats.periodCount} ${viewMode === "day" ? "ngày" : "tháng"}`,
              icon: "📅",
              gradient: "linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)",
              shadow: "0 8px 24px rgba(255, 152, 0, 0.3)"
            },
          ].map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3,
                  height: "100%",
                  background: stat.gradient,
                  color: "white",
                  borderRadius: 3,
                  boxShadow: stat.shadow,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  "&:hover": {
                    transform: "translateY(-8px) scale(1.02)",
                    boxShadow: `0 12px 32px ${stat.shadow.split("rgba")[1].split(")")[0]}, 0.5)`,
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "100px",
                    height: "100px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "50%",
                    transform: "translate(30%, -30%)",
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: "2rem" }}>
                    {stat.icon}
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ 
                  mt: 1,
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                  position: "relative",
                  zIndex: 1,
                }}>
                  {stat.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Chart */}
      <Card 
        elevation={0} 
        sx={{ 
          borderRadius: 4,
          overflow: "hidden",
          background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(13, 71, 161, 0.08)",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            border: "1px solid rgba(13, 71, 161, 0.15)",
          },
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {chartData.length === 0 && !error ? (
            <Box 
              textAlign="center" 
              py={10}
              sx={{
                background: "linear-gradient(135deg, rgba(13, 71, 161, 0.02) 0%, rgba(33, 150, 243, 0.01) 100%)",
                borderRadius: 3,
                minHeight: 450,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" sx={{ fontSize: "4rem", mb: 2 }}>
                📊
              </Typography>
              <Typography variant="h6" color="textSecondary" fontWeight="medium">
                Không có dữ liệu trong khoảng thời gian này
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Vui lòng thử chọn khoảng thời gian khác
              </Typography>
            </Box>
          ) : chartData.length > 0 ? (
            <Box sx={{ width: "100%", height: 450 }}>
              <ResponsiveContainer width="100%" height="100%" className={styles.revenueChartContainer}>
                {renderChart()}
              </ResponsiveContainer>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RevenueChart;
