/**
 * 🧪 Quick Test for Revenue Service
 * Run this file to test revenue service functionality
 */

import { RevenueService } from "./revenue.service.js";

async function testRevenueService() {
  console.log("🧪 ========================================");
  console.log("🧪 TESTING REVENUE SERVICE");
  console.log("🧪 ========================================\n");

  try {
    // Test 1: Get today's revenue
    console.log("📊 Test 1: Get Today's Revenue");
    console.log("----------------------------------------");
    const todayRevenue = await RevenueService.getTodayRevenue();
    console.log("Today's Revenue:", todayRevenue.getFormattedRevenue());
    console.log("Orders:", todayRevenue.orders);
    console.log("Day:", todayRevenue.getDayOfWeek());
    console.log("✅ Test 1 passed\n");

    // Test 2: Get current month revenue
    console.log("📊 Test 2: Get Current Month Revenue");
    console.log("----------------------------------------");
    const currentMonth = await RevenueService.getCurrentMonthRevenue();
    console.log("Month:", currentMonth.getMonthName());
    console.log("Revenue:", currentMonth.getFormattedRevenue());
    console.log(
      "Growth:",
      `${currentMonth.getGrowthIndicator()} ${currentMonth.growth.toFixed(2)}%`
    );
    console.log("✅ Test 2 passed\n");

    // Test 3: Get revenue by day (last 7 days)
    console.log("📊 Test 3: Get Revenue by Day (Last 7 Days)");
    console.log("----------------------------------------");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const dailyRevenue = await RevenueService.getRevenueByDay(
      startDate,
      endDate
    );
    console.log(`Loaded ${dailyRevenue.length} days`);
    if (dailyRevenue.length > 0) {
      console.log("Sample:", dailyRevenue[0].toJSON());
    }
    console.log("✅ Test 3 passed\n");

    // Test 4: Get revenue by package
    console.log("📊 Test 4: Get Revenue by Package");
    console.log("----------------------------------------");
    const packageRevenue = await RevenueService.getRevenueByPackage({
      limit: 100,
    });
    console.log(`Found ${packageRevenue.length} packages`);
    if (packageRevenue.length > 0) {
      const top = packageRevenue[0];
      console.log("Top Package:", {
        name: top.packageName,
        revenue: top.getFormattedRevenue(),
        orders: top.orders,
        users: top.uniqueUsers,
      });
    }
    console.log("✅ Test 4 passed\n");

    // Test 5: Get revenue summary
    console.log("📊 Test 5: Get Revenue Summary (This Month)");
    console.log("----------------------------------------");
    const { startDate: monthStart, endDate: monthEnd } =
      RevenueService.getDateRangeForPeriod("this_month");
    const summary = await RevenueService.getRevenueSummary(
      monthStart,
      monthEnd
    );
    console.log("Summary:", {
      totalRevenue: summary.getFormattedTotalRevenue(),
      totalOrders: summary.totalOrders,
      totalUsers: summary.totalUsers,
      avgOrderValue: summary.getFormattedAvgOrderValue(),
      growthRate: `${summary.growthRate.toFixed(2)}%`,
      status: summary.getGrowthStatus(),
    });
    console.log("KPIs:", summary.getKPIs());
    console.log("✅ Test 5 passed\n");

    // Test 6: Utility functions
    console.log("📊 Test 6: Utility Functions");
    console.log("----------------------------------------");
    console.log("Format Currency:", RevenueService.formatCurrency(1500000));
    console.log("Format Number:", RevenueService.formatNumber(12345));
    console.log(
      "Calculate Percentage:",
      RevenueService.calculatePercentage(150, 500) + "%"
    );
    console.log("Week Number:", RevenueService.getWeekNumber(new Date()));
    console.log("✅ Test 6 passed\n");

    console.log("🎉 ========================================");
    console.log("🎉 ALL TESTS PASSED!");
    console.log("🎉 ========================================");
  } catch (error) {
    console.error("❌ ========================================");
    console.error("❌ TEST FAILED!");
    console.error("❌ ========================================");
    console.error(error);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRevenueService();
}

export { testRevenueService };
