import React, { useState, useEffect } from "react";
import styles from "./FinancialDashboard.module.css";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Backdrop,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  MoneyOff,
  AccountBalance,
  Assessment,
  Download,
} from "@mui/icons-material";
import { FinancialService } from "../../firebase/lib/features/financial";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

/**
 * 💼 Financial Dashboard
 * Giao diện tổng hợp tài chính: THU - CHI - LỢI NHUẬN
 */
export default function FinancialDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [trends, setTrends] = useState(null);
  const [yearlyData, setYearlyData] = useState([]);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [tabValue, setTabValue] = useState(0);

  // Load financial data
  useEffect(() => {
    loadFinancialData();
  }, [selectedYear, selectedMonth]);

  // Load yearly data when year changes
  useEffect(() => {
    loadYearlyData();
  }, [selectedYear]);

  const loadYearlyData = async () => {
    try {
      setYearlyLoading(true);
      const promises = Array.from({ length: 12 }, (_, i) => i + 1).map(async (month) => {
        try {
          const monthReport = await FinancialService.getMonthlyFinancialReport(
            selectedYear,
            month
          );
          return {
            month: `Tháng ${month}`,
            monthNum: month,
            revenue: monthReport.breakdown.totalRevenue || 0,
            expenses: monthReport.breakdown.totalCosts || 0,
            profit: monthReport.profitLoss.netProfit || 0,
          };
        } catch (err) {
          return {
            month: `Tháng ${month}`,
            monthNum: month,
            revenue: 0,
            expenses: 0,
            profit: 0,
          };
        }
      });

      const monthlyData = await Promise.all(promises);
      setYearlyData(monthlyData);
      setYearlyLoading(false);
    } catch (err) {
      console.error("Load yearly data error:", err);
      setYearlyLoading(false);
    }
  };

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [monthlyReport, trendData] = await Promise.all([
        FinancialService.getMonthlyFinancialReport(selectedYear, selectedMonth),
        FinancialService.getFinancialTrends(selectedYear, selectedMonth, 6)
      ]);

      setReport(monthlyReport);
      console.log("Trends data loaded:", trendData);
      setTrends(trendData);

      setLoading(false);
    } catch (err) {
      console.error("Load financial data error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;

    const csvData = FinancialService.exportFinancialReportToCSV(report);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-tai-chinh-${selectedMonth}-${selectedYear}.csv`;
    link.click();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading && !report) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" className={styles.financialAlert}>Lỗi: {error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box className={styles.financialHeader} display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          📊 Quản lý Tài chính
        </Typography>

        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tháng</InputLabel>
            <Select
              value={selectedMonth}
              label="Tháng"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <MenuItem key={month} value={month}>
                  Tháng {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Năm</InputLabel>
            <Select
              value={selectedYear}
              label="Năm"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                (year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={!report}
          >
            Xuất Excel
          </Button>
        </Box>
      </Box>

      {report && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} className={styles.summaryCardsContainer}>
            {/* Revenue Card */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card className={`${styles.summaryCard} ${styles.revenueCard}`}>
                <CardContent className={styles.summaryCardContent}>
                  <Box className={styles.summaryCardHeader}>
                    <Typography className={styles.summaryCardTitle}>Doanh thu</Typography>
                    <Typography className={styles.summaryCardIcon} sx={{ fontWeight: 'bold', fontSize: '22px !important' }}>VNĐ</Typography>
                  </Box>
                  <Typography className={styles.summaryCardValue}>
                    {formatCurrency(report.revenue.total)}
                  </Typography>
                  <Typography className={styles.summaryCardSubtitle}>
                    📦 {report.revenue.orderCount} đơn hàng
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Expenses Card */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card className={`${styles.summaryCard} ${styles.expensesCard}`}>
                <CardContent className={styles.summaryCardContent}>
                  <Box className={styles.summaryCardHeader}>
                    <Typography className={styles.summaryCardTitle}>Chi phí</Typography>
                    <Typography className={styles.summaryCardIcon} sx={{ fontWeight: 'bold', fontSize: '22px !important' }}>VNĐ</Typography>
                  </Box>
                  <Typography className={styles.summaryCardValue}>
                    {formatCurrency(report.breakdown.totalCosts)}
                  </Typography>
                  <Typography className={styles.summaryCardSubtitle}>
                    💼 Vận hành + Lương
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Profit Card */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card className={`${styles.summaryCard} ${report.profitLoss.netProfit > 0 ? styles.profitCardPositive : styles.profitCardNegative}`}>
                <CardContent className={styles.summaryCardContent}>
                  <Box className={styles.summaryCardHeader}>
                    <Typography className={styles.summaryCardTitle}>Lợi nhuận</Typography>
                    {report.profitLoss.netProfit > 0 ? (
                      <TrendingUp className={styles.summaryCardIcon} />
                    ) : (
                      <TrendingDown className={styles.summaryCardIcon} />
                    )}
                  </Box>
                  <Typography className={styles.summaryCardValue}>
                    {formatCurrency(report.profitLoss.netProfit)}
                  </Typography>
                  <Typography className={styles.summaryCardSubtitle}>
                    {report.profitLoss.status === "profit"
                      ? "✅ Sinh lời"
                      : report.profitLoss.status === "loss"
                      ? "⚠️ Lỗ"
                      : "⚖️ Hòa vốn"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* ROI Card */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card className={`${styles.summaryCard} ${styles.roiCard}`}>
                <CardContent className={styles.summaryCardContent}>
                  <Box className={styles.summaryCardHeader}>
                    <Typography className={styles.summaryCardTitle}>ROI</Typography>
                    <Assessment className={styles.summaryCardIcon} />
                  </Box>
                  <Typography className={styles.summaryCardValue}>
                    {formatPercent(report.profitLoss.roi)}
                  </Typography>
                  <Typography className={styles.summaryCardSubtitle}>
                    📈 Tỷ suất lợi nhuận
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Box className={styles.financialTabsContainer}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} className={styles.financialTabs}>
              <Tab label="Tổng quan tháng" />
              <Tab label="So sánh cả năm" />
              <Tab label="Chi tiết Thu Chi" />
              <Tab label="Bảng lương" />
              <Tab label="Xu hướng" />
            </Tabs>
          </Box>

          {/* Tab 0: Overview */}
          {tabValue === 0 && (
            <Box className={styles.overviewSection} sx={{ width: '100%', mt: 2 }}>
              <Grid container spacing={3}>
                {/* 1. CẤU TRÚC TÀI CHÍNH (Financial Structure) */}
                <Grid size={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        📊 Cơ cấu Tài chính & Dòng tiền
                      </Typography>
                      <Chip label={report.profitLoss.netProfit >= 0 ? "Đang có lãi" : "Đang lỗ"} color={report.profitLoss.netProfit >= 0 ? "success" : "error"} size="small" />
                    </Box>

                    {/* Top Stats Row */}
                    <Grid container spacing={3} mb={4}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ p: 2, bgcolor: '#f8faff', borderRadius: 2, border: '1px solid #e3f2fd' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>Tổng Doanh thu</Typography>
                          <Typography variant="h5" fontWeight="bold" color="primary.main">
                            {formatCurrency(report.breakdown.totalRevenue)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">100% dòng tiền vào</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ p: 2, bgcolor: '#fff8f8', borderRadius: 2, border: '1px solid #ffebee' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>Tổng Chi phí</Typography>
                          <Typography variant="h5" fontWeight="bold" color="error.main">
                            {formatCurrency(report.breakdown.totalCosts)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {((report.breakdown.totalCosts / report.breakdown.totalRevenue) * 100).toFixed(1)}% doanh thu
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ p: 2, bgcolor: '#f6fff7', borderRadius: 2, border: '1px solid #e8f5e9' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>Lợi nhuận Ròng</Typography>
                          <Typography variant="h5" fontWeight="bold" color={report.profitLoss.netProfit >= 0 ? "success.main" : "error.main"}>
                            {formatCurrency(report.profitLoss.netProfit)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {((report.profitLoss.netProfit / report.breakdown.totalRevenue) * 100).toFixed(1)}% biên lợi nhuận
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Visual Stacked Bar */}
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom fontWeight="bold">Phân bổ Doanh thu:</Typography>
                      <Box sx={{ display: 'flex', width: '100%', height: 24, borderRadius: 4, overflow: 'hidden', bgcolor: '#f5f5f5' }}>
                        {/* Operating Expenses */}
                        <Tooltip title={`Chi vận hành: ${formatCurrency(report.breakdown.totalExpenses)}`}>
                          <Box sx={{ 
                            width: `${Math.min((report.breakdown.totalExpenses / report.breakdown.totalRevenue) * 100, 100)}%`, 
                            bgcolor: '#ffb74d', 
                            transition: 'width 1s' 
                          }} />
                        </Tooltip>
                        {/* Salary Expenses */}
                        <Tooltip title={`Chi lương: ${formatCurrency(report.breakdown.totalSalary)}`}>
                          <Box sx={{ 
                            width: `${Math.min((report.breakdown.totalSalary / report.breakdown.totalRevenue) * 100, 100)}%`, 
                            bgcolor: '#f06292', 
                            transition: 'width 1s' 
                          }} />
                        </Tooltip>
                        {/* Profit (if positive) */}
                        {report.profitLoss.netProfit > 0 && (
                          <Tooltip title={`Lợi nhuận: ${formatCurrency(report.profitLoss.netProfit)}`}>
                            <Box sx={{ 
                              width: `${(report.profitLoss.netProfit / report.breakdown.totalRevenue) * 100}%`, 
                              bgcolor: '#66bb6a', 
                              transition: 'width 1s' 
                            }} />
                          </Tooltip>
                        )}
                      </Box>
                      {/* Legend */}
                      <Box display="flex" gap={3} mt={1} flexWrap="wrap">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ffb74d' }} />
                          <Typography variant="caption">Vận hành ({((report.breakdown.totalExpenses / report.breakdown.totalRevenue) * 100).toFixed(1)}%)</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f06292' }} />
                          <Typography variant="caption">Lương nhân viên ({((report.breakdown.totalSalary / report.breakdown.totalRevenue) * 100).toFixed(1)}%)</Typography>
                        </Box>
                        {report.profitLoss.netProfit > 0 && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#66bb6a' }} />
                            <Typography variant="caption">Lợi nhuận ({((report.profitLoss.netProfit / report.breakdown.totalRevenue) * 100).toFixed(1)}%)</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* 2. HIỆU QUẢ ĐẦU TƯ (Efficiency) */}
                <Grid size={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                      📈 Hiệu quả Đầu tư & Tỷ suất Lợi nhuận
                    </Typography>
                    
                    <Grid container spacing={4} alignItems="center" justifyContent="center">
                      {/* Gross Margin */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Box sx={{ position: 'relative', width: 160, height: 100 }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[{ value: report.profitLoss.grossMargin }, { value: 100 - report.profitLoss.grossMargin }]}
                                    cx="50%" cy="100%"
                                    startAngle={180} endAngle={0}
                                    innerRadius={60} outerRadius={80}
                                    paddingAngle={0}
                                    dataKey="value"
                                  >
                                    <Cell fill="#42a5f5" />
                                    <Cell fill="#e0e0e0" />
                                  </Pie>
                                </PieChart>
                             </ResponsiveContainer>
                             <Typography variant="h5" fontWeight="bold" sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', color: '#42a5f5' }}>
                                {formatPercent(report.profitLoss.grossMargin)}
                             </Typography>
                          </Box>
                          <Typography variant="subtitle1" fontWeight="bold" mt={1}>Biên LN Gộp</Typography>
                          <Typography variant="caption" color="text.secondary" align="center">Hiệu quả sau chi phí vận hành</Typography>
                        </Box>
                      </Grid>

                      {/* Net Margin */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Box sx={{ position: 'relative', width: 160, height: 100 }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[{ value: Math.max(0, report.profitLoss.netMargin) }, { value: 100 - Math.max(0, report.profitLoss.netMargin) }]}
                                    cx="50%" cy="100%"
                                    startAngle={180} endAngle={0}
                                    innerRadius={60} outerRadius={80}
                                    paddingAngle={0}
                                    dataKey="value"
                                  >
                                    <Cell fill={report.profitLoss.netMargin >= 0 ? "#66bb6a" : "#ef5350"} />
                                    <Cell fill="#e0e0e0" />
                                  </Pie>
                                </PieChart>
                             </ResponsiveContainer>
                             <Typography variant="h5" fontWeight="bold" sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', color: report.profitLoss.netMargin >= 0 ? "#66bb6a" : "#ef5350" }}>
                                {formatPercent(report.profitLoss.netMargin)}
                             </Typography>
                          </Box>
                          <Typography variant="subtitle1" fontWeight="bold" mt={1}>Biên LN Ròng</Typography>
                          <Typography variant="caption" color="text.secondary" align="center">Hiệu quả thực tế cuối cùng</Typography>
                        </Box>
                      </Grid>

                      {/* ROI */}
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Box sx={{ position: 'relative', width: 160, height: 100 }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[{ value: Math.min(Math.max(0, report.profitLoss.roi), 100) }, { value: 100 - Math.min(Math.max(0, report.profitLoss.roi), 100) }]}
                                    cx="50%" cy="100%"
                                    startAngle={180} endAngle={0}
                                    innerRadius={60} outerRadius={80}
                                    paddingAngle={0}
                                    dataKey="value"
                                  >
                                    <Cell fill="#ab47bc" />
                                    <Cell fill="#e0e0e0" />
                                  </Pie>
                                </PieChart>
                             </ResponsiveContainer>
                             <Typography variant="h5" fontWeight="bold" sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', color: '#ab47bc' }}>
                                {formatPercent(report.profitLoss.roi)}
                             </Typography>
                          </Box>
                          <Typography variant="subtitle1" fontWeight="bold" mt={1}>ROI (Tỷ suất hoàn vốn)</Typography>
                          <Typography variant="caption" color="text.secondary" align="center">Lợi nhuận trên tổng chi phí</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 1: Yearly Comparison */}
          {tabValue === 1 && (
            <Grid container spacing={3} className={styles.tabPanelContent}>
              {/* Yearly Revenue Comparison Chart */}
              <Grid item xs={12}>
                <Paper className={styles.breakdownCard}>
                  <Typography className={styles.breakdownCardTitle}>
                    📊 So sánh Doanh thu - Chi phí - Lợi nhuận các tháng năm {selectedYear}
                  </Typography>
                  <Box mt={2}>
                    {yearlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                          data={yearlyData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis 
                            dataKey="month" 
                            angle={-15}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis />
                          <RechartsTooltip
                            formatter={(value) => new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(value)}
                          />
                          <Legend />
                          <Bar 
                            dataKey="revenue" 
                            name="Doanh thu" 
                            fill="#667eea" 
                            radius={[8, 8, 0, 0]}
                          />
                          <Bar 
                            dataKey="expenses" 
                            name="Chi phí" 
                            fill="#f5576c" 
                            radius={[8, 8, 0, 0]}
                          />
                          <Bar 
                            dataKey="profit" 
                            name="Lợi nhuận" 
                            fill="#4caf50" 
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                        <CircularProgress />
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Revenue Trend Line Chart */}
              <Grid item xs={12} md={6}>
                <Paper className={styles.breakdownCard}>
                  <Typography className={styles.breakdownCardTitle}>
                    📈 Xu hướng Doanh thu năm {selectedYear}
                  </Typography>
                  <Box mt={2}>
                    {yearlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart
                          data={yearlyData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis dataKey="month" angle={-15} textAnchor="end" height={60} />
                          <YAxis />
                          <RechartsTooltip
                            formatter={(value) => new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(value)}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#667eea"
                            strokeWidth={3}
                            name="Doanh thu"
                            dot={{ r: 5, fill: '#667eea' }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height={320}>
                        <CircularProgress size={30} />
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Profit Comparison Chart */}
              <Grid item xs={12} md={6}>
                <Paper className={styles.breakdownCard}>
                  <Typography className={styles.breakdownCardTitle}>
                    💰 So sánh Lợi nhuận năm {selectedYear}
                  </Typography>
                  <Box mt={2}>
                    {yearlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={yearlyData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                          <XAxis dataKey="month" angle={-15} textAnchor="end" height={60} />
                          <YAxis />
                          <RechartsTooltip
                            formatter={(value) => new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(value)}
                          />
                          <Bar dataKey="profit" name="Lợi nhuận" radius={[8, 8, 0, 0]}>
                            {yearlyData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.profit >= 0 ? '#4caf50' : '#ff5252'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height={320}>
                        <CircularProgress size={30} />
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Revenue & Expenses Details */}
          {tabValue === 2 && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Grid container spacing={3}>
                {/* 1. REVENUE DETAILS */}
                <Grid size={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        💰 Chi tiết Doanh thu theo Gói tập
                      </Typography>
                      <Chip label={`${report.revenue.orderCount} đơn hàng`} color="primary" variant="outlined" size="small" />
                    </Box>
                    
                    <Grid container spacing={4}>
                      {/* Left: List with Progress Bars */}
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                          {report.revenue.byPackage.map((pkg, index) => {
                            const percent = (pkg.total / report.revenue.total) * 100;
                            return (
                              <Box key={index} mb={3}>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                  <Typography variant="body2" fontWeight="bold">{pkg.packageName}</Typography>
                                  <Typography variant="body2" fontWeight="bold" color="primary">{formatCurrency(pkg.total)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                  <Typography variant="caption" color="text.secondary">{pkg.count} đơn</Typography>
                                  <Typography variant="caption" color="text.secondary">{percent.toFixed(1)}%</Typography>
                                </Box>
                                <Box sx={{ width: '100%', height: 8, bgcolor: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
                                  <Box sx={{ width: `${percent}%`, height: '100%', bgcolor: '#667eea', borderRadius: 4 }} />
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Grid>

                      {/* Right: Chart */}
                      <Grid size={{ xs: 12, md: 7 }}>
                        <Box height={350} width="100%">
                          {report.revenue.byPackage && report.revenue.byPackage.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={report.revenue.byPackage}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis 
                                  dataKey="packageName" 
                                  type="category" 
                                  width={100}
                                  tick={{ fontSize: 11 }} 
                                />
                                <RechartsTooltip
                                  cursor={{ fill: '#f5f5f5' }}
                                  formatter={(value) => formatCurrency(value)}
                                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="total" name="Doanh thu" barSize={20} radius={[0, 4, 4, 0]}>
                                  {report.revenue.byPackage.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#667eea', '#764ba2', '#4facfe', '#f093fb', '#fbbf24'][index % 5]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                              <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* 2. EXPENSES DETAILS */}
                <Grid size={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h6" fontWeight="bold" color="error">
                        💸 Chi tiết Chi phí vận hành
                      </Typography>
                      <Chip label={`${report.expenses.byType.length} loại chi phí`} color="error" variant="outlined" size="small" />
                    </Box>

                    <Grid container spacing={4}>
                      {/* Left: List with Progress Bars */}
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                          {report.expenses.byType.map((exp, index) => {
                            const percent = (exp.total / report.breakdown.totalExpenses) * 100; // Calculate against total operating expenses
                            return (
                              <Box key={index} mb={3}>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                  <Typography variant="body2" fontWeight="bold">{exp.typeLabel}</Typography>
                                  <Typography variant="body2" fontWeight="bold" color="error">{formatCurrency(exp.total)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                  <Typography variant="caption" color="text.secondary">{exp.count} khoản chi</Typography>
                                  <Typography variant="caption" color="text.secondary">{percent.toFixed(1)}%</Typography>
                                </Box>
                                <Box sx={{ width: '100%', height: 8, bgcolor: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
                                  <Box sx={{ width: `${percent}%`, height: '100%', bgcolor: '#f5576c', borderRadius: 4 }} />
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Grid>

                      {/* Right: Pie Chart */}
                      <Grid size={{ xs: 12, md: 7 }}>
                        <Box height={350} width="100%" display="flex" justifyContent="center" alignItems="center">
                          {report.expenses.byType && report.expenses.byType.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                <Pie
                                  data={report.expenses.byType}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={100}
                                  paddingAngle={2}
                                  dataKey="total"
                                  label={({ payload, percent }) => `${payload.typeLabel}: ${(percent * 100).toFixed(0)}%`}
                                  labelLine={true}
                                >
                                  {report.expenses.byType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#f5576c', '#f093fb', '#fa709a', '#fbbf24', '#a8edea'][index % 5]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip
                                  formatter={(value) => formatCurrency(value)}
                                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                              <Typography color="text.secondary">Chưa có dữ liệu</Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* 3. SALARY DETAILS */}
                <Grid size={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        💵 Tổng hợp Chi phí Lương
                      </Typography>
                      <Button size="small" variant="text" onClick={() => setTabValue(3)}>Xem chi tiết bảng lương →</Button>
                    </Box>
                    
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ p: 2, bgcolor: '#f8faff', borderRadius: 2, border: '1px solid #e3f2fd', textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" gutterBottom>Lương cơ bản</Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            {formatCurrency(report.salary.totals.baseSalary)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ p: 2, bgcolor: '#fff8f8', borderRadius: 2, border: '1px solid #ffebee', textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" gutterBottom>Phụ cấp & Thưởng</Typography>
                          <Typography variant="h6" fontWeight="bold" color="error">
                            {formatCurrency(report.salary.totals.allowances + report.salary.totals.bonuses)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffe0b2', textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" gutterBottom>Hoa hồng</Typography>
                          <Typography variant="h6" fontWeight="bold" color="warning.main">
                            {formatCurrency(report.salary.totals.commission)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ p: 2, bgcolor: '#f3e5f5', borderRadius: 2, border: '1px solid #e1bee7', textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" gutterBottom>Tổng thực chi</Typography>
                          <Typography variant="h6" fontWeight="bold" color="secondary">
                            {formatCurrency(report.salary.totals.netSalary)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 3: Salary Detail */}
          {tabValue === 3 && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Grid container spacing={3}>
                {/* Header Card */}
                <Grid size={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h6" fontWeight="bold" color="text.primary">
                        💵 Chi tiết Bảng lương tháng {selectedMonth}/{selectedYear}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => window.location.href = '/admin/payroll'}
                      >
                        Quản lý chi tiết →
                      </Button>
                    </Box>

                    {/* Summary Cards Grid */}
                    <Grid container spacing={3} mb={4}>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ 
                          p: 3, 
                          bgcolor: '#f8faff', 
                          borderRadius: 2, 
                          border: '1px solid #e3f2fd',
                          textAlign: 'center',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="h3" fontWeight="bold" color="primary.main" mb={1}>
                            {report.salary.employeeCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Số nhân viên
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ 
                          p: 3, 
                          bgcolor: '#fff8f8', 
                          borderRadius: 2, 
                          border: '1px solid #ffebee',
                          textAlign: 'center',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="h6" fontWeight="bold" color="error.main" mb={1}>
                            {formatCurrency(report.salary.totals.baseSalary)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Lương cơ bản
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ 
                          p: 3, 
                          bgcolor: '#f3e5f5', 
                          borderRadius: 2, 
                          border: '1px solid #e1bee7',
                          textAlign: 'center',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="h6" fontWeight="bold" color="secondary.main" mb={1}>
                            {formatCurrency(report.salary.totals.allowances + report.salary.totals.bonuses)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Phụ cấp & Thưởng
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ 
                          p: 3, 
                          bgcolor: '#fff3e0', 
                          borderRadius: 2, 
                          border: '1px solid #ffe0b2',
                          textAlign: 'center',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="h6" fontWeight="bold" color="warning.main" mb={1}>
                            {formatCurrency(report.salary.totals.commission)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Hoa hồng PT
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Position Breakdown - Compact Grid */}
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                      Phân bổ theo Chức vụ
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(report.salary.breakdown.byPosition || {}).map(([position, data]) => (
                        <Grid size={{ xs: 6, md: 4, lg: 3 }} key={position}>
                          <Box sx={{ 
                            p: 2.5, 
                            bgcolor: '#f5f5f5', 
                            borderRadius: 2,
                            border: '1px solid #e0e0e0',
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            '&:hover': {
                              bgcolor: '#e8eaf6',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }
                          }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              {position}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary.main" mb={0.5}>
                              {formatCurrency(data.totalSalary)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {data.count} người
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 4: Trends */}
          {tabValue === 4 && trends && (
            <Box className={styles.trendsSection} sx={{ width: '100%', mt: 3 }}>
              <Paper className={styles.detailSectionCard} sx={{ p: 3, width: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    📈 Phân tích Xu hướng Tài chính (6 tháng gần nhất)
                  </Typography>
                  <Chip 
                    label={`Dữ liệu từ ${trends.trends[0]?.label} đến ${trends.trends[trends.trends.length-1]?.label}`} 
                    variant="outlined" 
                    color="primary" 
                  />
                </Box>

                {/* 1. Biểu đồ trực quan (Chart) */}
                <Box height={500} mb={4} sx={{ width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={trends.trends}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid stroke="#f5f5f5" />
                      <XAxis dataKey="label" scale="band" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Doanh thu" barSize={40} fill="#667eea" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="costs" name="Chi phí" barSize={40} fill="#f5576c" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#4caf50" strokeWidth={3} dot={{r: 6}} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>

                {/* 2. Chỉ số trung bình (Averages) */}
                <Grid container spacing={3} mb={4}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ bgcolor: '#f8faff', borderColor: '#e3f2fd', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Doanh thu trung bình/tháng
                        </Typography>
                        <Typography variant="h5" color="primary.main" fontWeight="bold">
                          {formatCurrency(trends.averages.revenue)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ bgcolor: '#fff8f8', borderColor: '#ffebee', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Chi phí trung bình/tháng
                        </Typography>
                        <Typography variant="h5" color="error.main" fontWeight="bold">
                          {formatCurrency(trends.averages.expenses)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ bgcolor: '#f6fff7', borderColor: '#e8f5e9', height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Lợi nhuận trung bình/tháng
                        </Typography>
                        <Typography variant="h5" color="success.main" fontWeight="bold">
                          {formatCurrency(trends.averages.profit)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* 3. Bảng chi tiết (Table) */}
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Chi tiết số liệu theo tháng
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Tháng</TableCell>
                        <TableCell align="right">Doanh thu</TableCell>
                        <TableCell align="right">Chi phí</TableCell>
                        <TableCell align="right">Lợi nhuận</TableCell>
                        <TableCell align="right">Biên lợi nhuận</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trends.trends.map((row, index) => (
                        <TableRow key={index} hover>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                            {row.label}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#667eea' }}>
                            {formatCurrency(row.revenue)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#f5576c' }}>
                            {formatCurrency(row.costs)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: row.profit >= 0 ? 'success.main' : 'error.main' }}>
                            {formatCurrency(row.profit)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercent(row.margin)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={row.profit > 0 ? "Có lãi" : row.profit < 0 ? "Lỗ" : "Hòa vốn"} 
                              color={row.profit > 0 ? "success" : row.profit < 0 ? "error" : "default"}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}
        </>
      )}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading || yearlyLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  );
}