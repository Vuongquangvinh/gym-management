import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Stack,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  Block as BlockIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { PaymentOrderService, PaymentStatus } from "../../../firebase/lib/features/payment";
import RevenueChart from "../revenueChart/revenueChart";
import TopUsers from "../topUsers/topUsers";
import styles from './paymentHistory.module.css';

const PaymentHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await PaymentOrderService.getAllOrders({ limit: 1000 });
      const fetchedOrders = result.orders || [];

      setOrders(fetchedOrders);

      const stats = {
        total: fetchedOrders.length,
        pending: fetchedOrders.filter((o) => o.status === "PENDING").length,
        paid: fetchedOrders.filter((o) => o.status === "PAID").length,
        cancelled: fetchedOrders.filter((o) => o.status === "CANCELLED").length,
        failed: fetchedOrders.filter((o) => o.status === "FAILED").length,
        totalAmount: fetchedOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
        paidAmount: fetchedOrders
          .filter((o) => o.status === "PAID")
          .reduce((sum, o) => sum + (o.amount || 0), 0),
      };
      setStats(stats);
    } catch (err) {
      setError(`KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u: ${err.message}`);
      setOrders([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchTerm ||
        order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderCode?.toString().includes(searchTerm) ||
        order.packageName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Status helpers
  const getStatusConfig = (status) => {
    switch (status) {
      case PaymentStatus.PAID:
        return { label: "ÄÃ£ thanh toÃ¡n", color: "success", icon: <CheckCircleIcon /> };
      case PaymentStatus.PENDING:
        return { label: "Äang chá»", color: "warning", icon: <ScheduleIcon /> };
      case PaymentStatus.CANCELLED:
        return { label: "ÄÃ£ há»§y", color: "error", icon: <CancelIcon /> };
      case PaymentStatus.FAILED:
        return { label: "Tháº¥t báº¡i", color: "error", icon: <BlockIcon /> };
      case PaymentStatus.EXPIRED:
        return { label: "Háº¿t háº¡n", color: "default", icon: <AccessTimeIcon /> };
      default:
        return { label: "KhÃ´ng xÃ¡c Ä‘á»‹nh", color: "default", icon: <ScheduleIcon /> };
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailDialogOpen(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
        <CircularProgress size={48} />
        <Typography variant="body1" color="textSecondary">
          Äang táº£i lá»‹ch sá»­ thanh toÃ¡n...
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
            param($match)
            $originalClass = $match.Groups[1].Value
            $camelClass = Convert-ToCamelCase $originalClass
            "className={styles.$camelClass}"
         sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4} 
        flexWrap="wrap" 
        gap={2}
        sx={{
          p: 3,
          background: "linear-gradient(135deg, rgba(13, 71, 161, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)",
          borderRadius: 4,
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar 
            sx={{ 
              bgcolor: "primary.main", 
              width: 56, 
              height: 56,
              background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              boxShadow: "0 4px 16px rgba(25, 118, 210, 0.4)",
            }}
          >
            <MoneyIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              Lá»‹ch sá»­ thanh toÃ¡n
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Quáº£n lÃ½ vÃ  theo dÃµi táº¥t cáº£ giao dá»‹ch thanh toÃ¡n
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadOrders}
          disabled={loading}
          sx={{ 
            borderRadius: 3,
            px: 3,
            py: 1.5,
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(13, 71, 161, 0.3)",
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 20px rgba(13, 71, 161, 0.4)",
              background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
            },
          }}
        >
          LÃ m má»›i
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          {[
            { 
              label: "Tá»•ng Ä‘Æ¡n", 
              value: stats.total, 
              icon: <TrendingUpIcon />, 
              color: "#2196F3",
              gradient: "linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)",
              bgGradient: "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(66, 165, 245, 0.05) 100%)"
            },
            { 
              label: "ÄÃ£ thanh toÃ¡n", 
              value: stats.paid, 
              amount: stats.paidAmount, 
              icon: <CheckCircleIcon />, 
              color: "#4CAF50",
              gradient: "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)",
              bgGradient: "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)"
            },
            { 
              label: "Äang chá»", 
              value: stats.pending, 
              icon: <ScheduleIcon />, 
              color: "#FF9800",
              gradient: "linear-gradient(135deg, #FF9800 0%, #FFA726 100%)",
              bgGradient: "linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 167, 38, 0.05) 100%)"
            },
            { 
              label: "ÄÃ£ há»§y", 
              value: stats.cancelled + stats.failed, 
              icon: <CancelIcon />, 
              color: "#F44336",
              gradient: "linear-gradient(135deg, #F44336 0%, #EF5350 100%)",
              bgGradient: "linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(239, 83, 80, 0.05) 100%)"
            },
          ].map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                sx={{
                  borderRadius: 4,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  background: "white",
                  border: "2px solid",
                  borderColor: "transparent",
                  "&:hover": { 
                    transform: "translateY(-8px) scale(1.03)", 
                    boxShadow: `0 12px 40px ${stat.color}40`,
                    borderColor: stat.color,
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "6px",
                    background: stat.gradient,
                  },
                }}
              >
                <CardContent sx={{ pb: 3, pt: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h3" fontWeight="bold" sx={{ 
                        background: stat.gradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}>
                        {stat.value}
                      </Typography>
                      {stat.amount !== undefined && (
                        <Typography variant="body2" fontWeight="medium" mt={1} sx={{ color: stat.color }}>
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stat.amount)}
                        </Typography>
                      )}
                    </Box>
                    <Avatar 
                      sx={{ 
                        background: stat.bgGradient,
                        color: stat.color, 
                        width: 64, 
                        height: 64,
                        boxShadow: `0 4px 12px ${stat.color}30`,
                      }}
                    >
                      {React.cloneElement(stat.icon, { fontSize: "large" })}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Revenue Chart */}
      <Box sx={{ mb: 4 }}>
        <RevenueChart />
      </Box>

      {/* Top Users */}
      <Box sx={{ mb: 4 }}>
        <TopUsers limit={10} />
      </Box>

      {/* Filters */}
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 4, 
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          background: "linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)",
          border: "1px solid rgba(13, 71, 161, 0.08)",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 6px 24px rgba(0, 0, 0, 0.12)",
            border: "1px solid rgba(13, 71, 161, 0.15)",
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="TÃ¬m tÃªn, email, mÃ£ Ä‘Æ¡n, gÃ³i..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  "& .MuiOutlinedInput-root": { 
                    borderRadius: 3,
                    backgroundColor: "white",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    },
                    "&.Mui-focused": {
                      boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)",
                    },
                  } 
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tráº¡ng thÃ¡i</InputLabel>
                <Select
                  value={statusFilter}
                  label="Tráº¡ng thÃ¡i"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  }
                  sx={{ 
                    borderRadius: 3,
                    backgroundColor: "white",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    },
                    "&.Mui-focused": {
                      boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)",
                    },
                  }}
                >
                  <MenuItem value="ALL">
                    <Chip label="Táº¥t cáº£" size="small" sx={{ minWidth: 100 }} />
                  </MenuItem>
                  {Object.values(PaymentStatus).map((status) => {
                    const config = getStatusConfig(status);
                    return (
                      <MenuItem key={status} value={status}>
                        <Chip
                          icon={config.icon}
                          label={config.label}
                          color={config.color}
                          size="small"
                          sx={{ minWidth: 100 }}
                        />
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 3,
                  background: "linear-gradient(135deg, rgba(13, 71, 161, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)",
                  border: "1px solid rgba(13, 71, 161, 0.1)",
                }}
              >
                <Typography variant="body1" color="textSecondary" fontWeight="medium">
                  <strong style={{ color: "#1976d2", fontSize: "1.25rem" }}>{filteredOrders.length}</strong> Ä‘Æ¡n hÃ ng Ä‘Æ°á»£c tÃ¬m tháº¥y
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card 
        sx={{ 
          borderRadius: 4, 
          overflow: "hidden", 
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(13, 71, 161, 0.08)",
          background: "white",
        }}
      >
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow 
                sx={{ 
                  background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
                }}
              >
                <TableCell sx={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", letterSpacing: 1.2, textTransform: "uppercase" }}>MÃ£ Ä‘Æ¡n</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", letterSpacing: 1.2, textTransform: "uppercase" }}>KhÃ¡ch hÃ ng</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", letterSpacing: 1.2, textTransform: "uppercase" }}>GÃ³i táº­p</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", letterSpacing: 1.2, textTransform: "uppercase" }} align="right">
                  Sá»‘ tiá»n
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", letterSpacing: 1.2, textTransform: "uppercase" }}>Tráº¡ng thÃ¡i</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", letterSpacing: 1.2, textTransform: "uppercase" }}>NgÃ y táº¡o</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", letterSpacing: 1.2, textTransform: "uppercase" }} align="center">
                  HÃ nh Ä‘á»™ng
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box
                      sx={{
                        background: "linear-gradient(135deg, rgba(13, 71, 161, 0.02) 0%, rgba(33, 150, 243, 0.01) 100%)",
                        borderRadius: 3,
                        p: 4,
                      }}
                    >
                      <Typography variant="h4" sx={{ fontSize: "3rem", mb: 2 }}>
                        ðŸ“¦
                      </Typography>
                      <Typography variant="h6" color="textSecondary" fontWeight="medium">
                        KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng nÃ o
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Thá»­ Ä‘iá»u chá»‰nh bá»™ lá»c hoáº·c tÃ¬m kiáº¿m khÃ¡c
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order, index) => {
                  const statusConfig = getStatusConfig(order.status);
                  return (
                    <TableRow
                      key={order.orderCode}
                      hover
                      sx={{
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        backgroundColor: index % 2 === 0 ? "rgba(13, 71, 161, 0.01)" : "white",
                        "&:hover": { 
                          backgroundColor: "rgba(13, 71, 161, 0.04) !important",
                          transform: "scale(1.001)",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                        },
                      }}
                      onClick={() => handleViewDetails(order)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" sx={{ 
                          color: "primary.main",
                          fontFamily: "monospace",
                        }}>
                          #{order.orderCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="column" spacing={0.5}>
                          <Typography variant="body2" fontWeight="medium">
                            {order.userName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.75rem" }}>
                            {order.userEmail}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight="medium">{order.packageName}</Typography>
                          <Typography variant="caption" sx={{ 
                            color: "primary.main",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}>
                            {order.packageDuration} ngÃ y
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" sx={{ 
                          color: "success.main",
                          fontFamily: "monospace",
                        }}>
                          {order.getFormattedAmount()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                          sx={{ 
                            minWidth: 120,
                            fontWeight: 600,
                            borderRadius: 5,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {order.getFormattedDate("createdAt")}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Xem chi tiáº¿t" arrow>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleViewDetails(order)}
                            sx={{
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.2) rotate(5deg)",
                                backgroundColor: "rgba(13, 71, 161, 0.1)",
                              },
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleCloseDetails} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 5,
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
            background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar 
                sx={{ 
                  background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                  width: 48,
                  height: 48,
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                }}
              >
                <MoneyIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Chi tiáº¿t Ä‘Æ¡n hÃ ng
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ThÃ´ng tin Ä‘áº§y Ä‘á»§ vá» giao dá»‹ch
                </Typography>
              </Box>
            </Box>
            {selectedOrder && (
              <Chip
                icon={getStatusConfig(selectedOrder.status).icon}
                label={getStatusConfig(selectedOrder.status).label}
                color={getStatusConfig(selectedOrder.status).color}
                sx={{ 
                  fontWeight: 600,
                  borderRadius: 5,
                }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedOrder && (
            <Stack spacing={3}>
              <Box 
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: "linear-gradient(135deg, rgba(13, 71, 161, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)",
                  border: "2px solid rgba(13, 71, 161, 0.1)",
                }}
              >
                <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight={600}>
                  MÃ£ Ä‘Æ¡n hÃ ng
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ 
                  fontFamily: "monospace",
                  color: "primary.main",
                }}>
                  #{selectedOrder.orderCode}
                </Typography>
              </Box>
              <Divider />
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight={600}>
                    KhÃ¡ch hÃ ng
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedOrder.userName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight={600}>
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedOrder.userEmail}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight={600}>
                    GÃ³i táº­p
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedOrder.packageName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight={600}>
                    Thá»i háº¡n
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="primary.main">{selectedOrder.packageDuration} ngÃ y</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight={600}>
                    Sá»‘ tiá»n
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: "success.main",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}>
                    {selectedOrder.getFormattedAmount()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight={600}>
                    MÃ£ giao dá»‹ch
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ fontFamily: "monospace" }}>
                    {selectedOrder.transactionId || "â€”"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight={600}>
                    NgÃ y táº¡o
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedOrder.getFormattedDate("createdAt")}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom fontWeight={600}>
                    Thanh toÃ¡n lÃºc
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedOrder.getFormattedPaymentTime() || "â€”"}</Typography>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDetails} 
            variant="contained" 
            sx={{ 
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(13, 71, 161, 0.3)",
              background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
                boxShadow: "0 6px 20px rgba(13, 71, 161, 0.4)",
              },
            }}
          >
            ÄÃ³ng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentHistory;

