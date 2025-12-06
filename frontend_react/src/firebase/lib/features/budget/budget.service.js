import { BudgetModel, BUDGET_PERIOD, BUDGET_STATUS } from "./budget.model.js";
import { ExpenseCategoryModel } from "../expense/expense-category.model.js";

/**
 * 📊 Budget Service
 * Service quản lý ngân sách
 */
export class BudgetService {
  /**
   * Create budget from expense categories
   */
  static async createBudgetFromCategories(budgetInfo) {
    try {
      const { name, description, period, year, month, quarter } = budgetInfo;

      // Get all active expense categories
      const categories = await ExpenseCategoryModel.getAll({
        activeOnly: true,
      });

      // Create category budgets based on category limits
      const categoryBudgets = categories.map((category) => {
        let plannedAmount = 0;

        if (period === BUDGET_PERIOD.MONTHLY && category.hasBudgetLimit) {
          plannedAmount = category.monthlyBudgetLimit;
        } else if (
          period === BUDGET_PERIOD.QUARTERLY &&
          category.hasBudgetLimit
        ) {
          plannedAmount = category.quarterlyBudgetLimit;
        } else if (period === BUDGET_PERIOD.YEARLY && category.hasBudgetLimit) {
          plannedAmount = category.yearlyBudgetLimit;
        }

        return {
          categoryId: category.id,
          categoryName: category.name,
          type: category.type,
          category: category.category,
          plannedAmount: plannedAmount,
          actualAmount: 0,
          variance: 0,
          variancePercent: 0,
        };
      });

      // Calculate totals
      const totalPlannedAmount = categoryBudgets.reduce(
        (sum, cat) => sum + cat.plannedAmount,
        0
      );

      // Create budget
      const budget = new BudgetModel({
        name,
        description,
        period,
        year,
        month,
        quarter,
        categoryBudgets,
        totalPlannedAmount,
        status: BUDGET_STATUS.DRAFT,
      });

      await budget.save();
      console.log("✅ Budget created from categories:", budget.id);
      return budget;
    } catch (error) {
      console.error("❌ Create budget from categories error:", error);
      throw error;
    }
  }

  /**
   * Update budget with actual expenses
   */
  static async updateBudgetActuals(budgetId) {
    try {
      const budget = await BudgetModel.getById(budgetId);
      if (!budget) {
        throw new Error("Budget not found");
      }

      await budget.updateActualAmounts();
      await budget.save();

      console.log("✅ Budget actuals updated:", budgetId);
      return budget;
    } catch (error) {
      console.error("❌ Update budget actuals error:", error);
      throw error;
    }
  }

  /**
   * Get budget performance analysis
   */
  static analyzeBudgetPerformance(budget) {
    const utilizationPercent = budget.getUtilizationPercent();
    const variancePercent = budget.getVariancePercent();

    // Overall status
    let overallStatus = "on_track";
    if (utilizationPercent > 100) {
      overallStatus = "over_budget";
    } else if (utilizationPercent < 70) {
      overallStatus = "under_utilized";
    }

    // Category analysis
    const categoryAnalysis = budget.categoryBudgets.map((cat) => {
      const utilization =
        cat.plannedAmount > 0
          ? (cat.actualAmount / cat.plannedAmount) * 100
          : 0;

      let status = "on_track";
      if (utilization > 100) {
        status = "over_budget";
      } else if (utilization < 70) {
        status = "under_utilized";
      }

      return {
        ...cat,
        utilization,
        status,
      };
    });

    // Find problem areas
    const overBudgetCategories = categoryAnalysis.filter(
      (c) => c.status === "over_budget"
    );
    const underUtilizedCategories = categoryAnalysis.filter(
      (c) => c.status === "under_utilized"
    );

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      period: budget.getPeriodLabel(),

      overall: {
        status: overallStatus,
        plannedAmount: budget.totalPlannedAmount,
        actualAmount: budget.totalActualAmount,
        variance: budget.totalVariance,
        variancePercent: variancePercent,
        utilization: utilizationPercent,
      },

      categories: categoryAnalysis,

      issues: {
        overBudget: overBudgetCategories,
        underUtilized: underUtilizedCategories,
      },

      recommendations: BudgetService.generateRecommendations(
        overallStatus,
        overBudgetCategories,
        underUtilizedCategories
      ),
    };
  }

  /**
   * Generate budget recommendations
   */
  static generateRecommendations(overallStatus, overBudget, underUtilized) {
    const recommendations = [];

    if (overallStatus === "over_budget") {
      recommendations.push({
        type: "warning",
        message:
          "Ngân sách đang vượt quá kế hoạch. Cần xem xét điều chỉnh chi tiêu.",
      });
    }

    if (overBudget.length > 0) {
      overBudget.forEach((cat) => {
        recommendations.push({
          type: "alert",
          category: cat.categoryName,
          message: `${cat.categoryName} vượt ngân sách ${Math.abs(
            cat.variancePercent
          ).toFixed(1)}%. Cần kiểm soát chi tiêu.`,
        });
      });
    }

    if (underUtilized.length > 0 && overallStatus !== "over_budget") {
      recommendations.push({
        type: "info",
        message: `Có ${underUtilized.length} danh mục chi tiêu thấp hơn kế hoạch. Có thể điều chỉnh ngân sách cho kỳ sau.`,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: "success",
        message: "Ngân sách đang được quản lý tốt, đúng theo kế hoạch.",
      });
    }

    return recommendations;
  }

  /**
   * Compare budgets between periods
   */
  static async compareBudgets(budget1Id, budget2Id) {
    try {
      const budget1 = await BudgetModel.getById(budget1Id);
      const budget2 = await BudgetModel.getById(budget2Id);

      if (!budget1 || !budget2) {
        throw new Error("One or both budgets not found");
      }

      const plannedDiff =
        budget2.totalPlannedAmount - budget1.totalPlannedAmount;
      const actualDiff = budget2.totalActualAmount - budget1.totalActualAmount;

      return {
        period1: {
          id: budget1.id,
          name: budget1.name,
          period: budget1.getPeriodLabel(),
          planned: budget1.totalPlannedAmount,
          actual: budget1.totalActualAmount,
          variance: budget1.totalVariance,
        },
        period2: {
          id: budget2.id,
          name: budget2.name,
          period: budget2.getPeriodLabel(),
          planned: budget2.totalPlannedAmount,
          actual: budget2.totalActualAmount,
          variance: budget2.totalVariance,
        },
        comparison: {
          plannedDiff: plannedDiff,
          actualDiff: actualDiff,
          plannedPercentChange:
            budget1.totalPlannedAmount > 0
              ? (plannedDiff / budget1.totalPlannedAmount) * 100
              : 0,
          actualPercentChange:
            budget1.totalActualAmount > 0
              ? (actualDiff / budget1.totalActualAmount) * 100
              : 0,
        },
      };
    } catch (error) {
      console.error("❌ Compare budgets error:", error);
      throw error;
    }
  }

  /**
   * Get budget trends for a year
   */
  static async getBudgetTrends(year) {
    try {
      const budgets = await BudgetModel.getAll({
        year,
        period: BUDGET_PERIOD.MONTHLY,
        status: BUDGET_STATUS.ACTIVE,
      });

      // Sort by month
      budgets.sort((a, b) => a.month - b.month);

      const trends = budgets.map((budget) => ({
        month: budget.month,
        period: budget.getPeriodLabel(),
        planned: budget.totalPlannedAmount,
        actual: budget.totalActualAmount,
        variance: budget.totalVariance,
        variancePercent: budget.getVariancePercent(),
        utilization: budget.getUtilizationPercent(),
      }));

      // Calculate averages
      const avgPlanned =
        trends.reduce((sum, t) => sum + t.planned, 0) / trends.length;
      const avgActual =
        trends.reduce((sum, t) => sum + t.actual, 0) / trends.length;
      const avgVariance =
        trends.reduce((sum, t) => sum + t.variance, 0) / trends.length;

      return {
        year,
        months: trends,
        averages: {
          planned: avgPlanned,
          actual: avgActual,
          variance: avgVariance,
        },
        total: {
          planned: trends.reduce((sum, t) => sum + t.planned, 0),
          actual: trends.reduce((sum, t) => sum + t.actual, 0),
          variance: trends.reduce((sum, t) => sum + t.variance, 0),
        },
      };
    } catch (error) {
      console.error("❌ Get budget trends error:", error);
      throw error;
    }
  }

  /**
   * Get budget forecast based on historical data
   */
  static async forecastBudget(year, month) {
    try {
      // Get previous 3 months
      const historicalBudgets = [];
      for (let i = 1; i <= 3; i++) {
        let prevMonth = month - i;
        let prevYear = year;

        if (prevMonth <= 0) {
          prevMonth += 12;
          prevYear -= 1;
        }

        const budget = await BudgetModel.getBudgetForPeriod(
          prevYear,
          BUDGET_PERIOD.MONTHLY,
          prevMonth
        );

        if (budget) {
          historicalBudgets.push(budget);
        }
      }

      if (historicalBudgets.length === 0) {
        return {
          forecast: null,
          message: "Không đủ dữ liệu lịch sử để dự báo",
        };
      }

      // Calculate average actual spending
      const avgActual =
        historicalBudgets.reduce((sum, b) => sum + b.totalActualAmount, 0) /
        historicalBudgets.length;

      // Group by category
      const categoryForecasts = {};

      historicalBudgets.forEach((budget) => {
        budget.categoryBudgets.forEach((cat) => {
          if (!categoryForecasts[cat.type]) {
            categoryForecasts[cat.type] = {
              type: cat.type,
              categoryName: cat.categoryName,
              amounts: [],
            };
          }
          categoryForecasts[cat.type].amounts.push(cat.actualAmount);
        });
      });

      // Calculate average for each category
      const forecastCategories = Object.values(categoryForecasts).map((cf) => ({
        type: cf.type,
        categoryName: cf.categoryName,
        forecastAmount:
          cf.amounts.reduce((sum, a) => sum + a, 0) / cf.amounts.length,
      }));

      return {
        year,
        month,
        forecast: {
          totalAmount: avgActual,
          categories: forecastCategories,
        },
        basedOn: {
          months: historicalBudgets.length,
          periods: historicalBudgets.map((b) => b.getPeriodLabel()),
        },
      };
    } catch (error) {
      console.error("❌ Forecast budget error:", error);
      throw error;
    }
  }

  /**
   * Export budget to CSV
   */
  static exportBudgetToCSV(budget) {
    const headers = [
      "Danh mục",
      "Loại",
      "Kế hoạch",
      "Thực tế",
      "Chênh lệch",
      "% Chênh lệch",
      "% Sử dụng",
    ].join(",");

    const rows = budget.categoryBudgets.map((cat) =>
      [
        cat.categoryName,
        cat.type,
        cat.plannedAmount,
        cat.actualAmount,
        cat.variance,
        cat.variancePercent.toFixed(2) + "%",
        ((cat.actualAmount / cat.plannedAmount) * 100).toFixed(2) + "%",
      ].join(",")
    );

    // Add totals row
    const totalsRow = [
      "TỔNG CỘNG",
      "",
      budget.totalPlannedAmount,
      budget.totalActualAmount,
      budget.totalVariance,
      budget.getVariancePercent().toFixed(2) + "%",
      budget.getUtilizationPercent().toFixed(2) + "%",
    ].join(",");

    return [headers, ...rows, totalsRow].join("\n");
  }
}
