import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Chip,
  Button,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { PaymentOrderModel } from "../../../firebase/lib/features/payment";
import "./topUsers.css";

const TopUsers = ({ limit = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    const loadTopUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔄 Loading top users by revenue...");
        const usersRevenue = await PaymentOrderModel.getRevenueByEachUser();

        // Lấy top N users
        const topN = usersRevenue.slice(0, limit);
        setTopUsers(topN);

        console.log(`✅ Loaded ${topN.length} top users`);
      } catch (err) {
        console.error("❌ Error loading top users:", err);
        setError(`Không thể tải dữ liệu: ${err.message}`);
        setTopUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadTopUsers();
  }, [limit]);

  const loadTopUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Reloading top users by revenue...");
      const usersRevenue = await PaymentOrderModel.getRevenueByEachUser();

      // Lấy top N users
      const topN = usersRevenue.slice(0, limit);
      setTopUsers(topN);

      console.log(`✅ Reloaded ${topN.length} top users`);
    } catch (err) {
      console.error("❌ Error reloading top users:", err);
      setError(`Không thể tải dữ liệu: ${err.message}`);
      setTopUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Get medal color for top 3
  const getMedalColor = (index) => {
    switch (index) {
      case 0:
        return "#FFD700"; // Gold
      case 1:
        return "#C0C0C0"; // Silver
      case 2:
        return "#CD7F32"; // Bronze
      default:
        return "#9E9E9E"; // Gray
    }
  };

  // Get rank icon
  const getRankIcon = (index) => {
    if (index < 3) {
      return <TrophyIcon sx={{ color: getMedalColor(index), fontSize: 32 }} />;
    }
    return (
      <Avatar
        sx={{
          bgcolor: "rgba(13, 71, 161, 0.1)",
          color: "primary.main",
          width: 40,
          height: 40,
          fontSize: "1rem",
          fontWeight: "bold",
        }}
      >
        {index + 1}
      </Avatar>
    );
  };

  if (loading) {
    return (
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        }}
      >
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight={300}
            gap={2}
          >
            <CircularProgress size={48} />
            <Typography variant="body1" color="textSecondary">
              Đang tải dữ liệu khách hàng...
            </Typography>
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
        mb={3}
        p={2.5}
        sx={{
          background: "linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 255, 255, 0.8) 100%)",
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
              background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(255, 215, 0, 0.4)",
            }}
          >
            <TrophyIcon sx={{ color: "white", fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ 
              background: "linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Top {limit} Khách Hàng
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Xếp hạng theo tổng doanh thu
            </Typography>
          </Box>
        </Box>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={loadTopUsers}
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Làm mới
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 3,
          }}
          action={
            <Button color="inherit" size="small" onClick={loadTopUsers}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Users List */}
      {topUsers.length === 0 && !error ? (
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <CardContent>
            <Box textAlign="center" py={6}>
              <Typography variant="h5" sx={{ fontSize: "3rem", mb: 2 }}>
                👥
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Chưa có dữ liệu khách hàng
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {topUsers.map((user, index) => (
            <Grid item xs={12} key={user.userId}>
              <Card
                className="top-user-card"
                sx={{
                  borderRadius: 3,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "pointer",
                  border: "2px solid",
                  borderColor: index < 3 ? getMedalColor(index) + "40" : "transparent",
                  "&:hover": {
                    transform: "translateX(8px)",
                    boxShadow: `0 8px 24px ${index < 3 ? getMedalColor(index) + "40" : "rgba(0,0,0,0.15)"}`,
                    borderColor: index < 3 ? getMedalColor(index) : "primary.main",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    {/* Rank */}
                    <Box minWidth={50} textAlign="center">
                      {getRankIcon(index)}
                    </Box>

                    {/* Avatar */}
                    <Avatar
                      src={user.avatar_url}
                      sx={{
                        width: 56,
                        height: 56,
                        border: index < 3 ? `3px solid ${getMedalColor(index)}` : "none",
                        boxShadow: index < 3 ? `0 4px 12px ${getMedalColor(index)}60` : "none",
                      }}
                    >
                      <PersonIcon />
                    </Avatar>

                    {/* User Info */}
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {user.userName}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                        {user.userEmail && (
                          <Typography variant="caption" color="textSecondary">
                            📧 {user.userEmail}
                          </Typography>
                        )}
                        {user.userPhone && (
                          <Typography variant="caption" color="textSecondary">
                            📱 {user.userPhone}
                          </Typography>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                        <Chip
                          label={`${user.orders} đơn`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                        {user.membership_status && (
                          <Chip
                            label={user.membership_status}
                            size="small"
                            color={user.membership_status === "Active" ? "success" : "default"}
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        {user.packages && user.packages.length > 0 && (
                          <Chip
                            label={`${user.packages.length} gói`}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Stack>
                    </Box>

                    {/* Revenue */}
                    <Box textAlign="right" minWidth={150}>
                      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                        Tổng doanh thu
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{
                          color: index < 3 ? getMedalColor(index) : "success.main",
                          fontFamily: "monospace",
                        }}
                      >
                        {formatCurrency(user.revenue)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TopUsers;
