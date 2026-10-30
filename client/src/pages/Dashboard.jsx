
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [expenseData, budgetData] = await Promise.all([
          apiRequest("/expenses"),
          apiRequest("/budgets"),
        ]);

        setExpenses(expenseData.expenses || []);
        setBudgets(budgetData.budgets || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const monthlyExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(`${expense.expense_date}T00:00:00`);
      return (
        expenseDate.getMonth() + 1 === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((total, expense) => total + Number(expense.amount), 0);

  const monthlyBudget = budgets
    .filter(
      (budget) =>
        budget.month === currentMonth && budget.year === currentYear
    )
    .reduce((total, budget) => total + Number(budget.amount), 0);

  const remainingBalance = monthlyBudget - monthlyExpenses;

  const formatCurrency = (amount) =>
    amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✿</span>
          <h2>SpendSmart</h2>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-link active">⌂ Overview</button>
          <button
            className="nav-link"
            onClick={() => navigate("/expenses")}
          >
            ↗ Expenses
          </button>
          <button
            className="nav-link"
            onClick={() => navigate("/budgets")}
          >
            ◷ Budgets
          </button>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">YOUR FINANCIAL SPACE</p>
            <h1>Good day, {user.name || "there"}! ☀️</h1>
            <p>Here's an overview of your finances.</p>
          </div>

          <div className="profile-circle">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <p className="eyebrow">WELCOME TO YOUR MONEY JOURNEY</p>
            <h2>Make every dollar count.</h2>
            <p>Build healthy spending habits, one day at a time.</p>
          </div>
          <span className="welcome-decoration">🌱</span>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Financial overview</h2>
              <p>Your financial activity for this month.</p>
            </div>
          </div>

          {loading ? (
            <p>Loading your financial information...</p>
          ) : (
            <>
              {error && <p className="budget-error">{error}</p>}

              <div className="summary-grid">
                <article className="summary-card">
                  <span>Monthly expenses</span>
                  <h3>{formatCurrency(monthlyExpenses)}</h3>
                  <p>Spent this month</p>
                </article>

                <article className="summary-card">
                  <span>Monthly budget</span>
                  <h3>{formatCurrency(monthlyBudget)}</h3>
                  <p>Budget set for this month</p>
                </article>

                <article className="summary-card">
                  <span>Remaining balance</span>
                  <h3>{formatCurrency(remainingBalance)}</h3>
                  <p>
                    {monthlyBudget === 0
                      ? "Create a budget to get started"
                      : remainingBalance < 0
                      ? "You are over your budget"
                      : "Available for the rest of the month"}
                  </p>
                </article>
              </div>
            </>
          )}
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Get started</h2>
              <p>Start organizing your finances.</p>
            </div>
          </div>

          <div className="action-grid">
            <article className="action-card">
              <span className="action-icon">＋</span>
              <h3>Add an expense</h3>
              <p>Record purchases and keep track of where your money goes.</p>
              <button onClick={() => navigate("/expenses")}>
                View expenses →
              </button>
            </article>

            <article className="action-card">
              <span className="action-icon">◎</span>
              <h3>Create a budget</h3>
              <p>Set monthly limits and work toward your financial goals.</p>
              <button onClick={() => navigate("/budgets")}>
                View budgets →
              </button>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
