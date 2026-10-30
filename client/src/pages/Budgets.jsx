
import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

function Budgets() {
  const today = new Date();

  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const categories = [
    "Food",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills",
    "Health",
    "Other",
  ];

  async function loadData() {
    try {
      setLoading(true);
      const [budgetData, expenseData] = await Promise.all([
        apiRequest("/budgets"),
        apiRequest("/expenses"),
      ]);

      setBudgets(budgetData.budgets || []);
      setExpenses(expenseData.expenses || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getSpent(budget) {
    return expenses
      .filter((expense) => {
        const expenseDate = new Date(`${expense.expense_date}T00:00:00`);

        return (
          expense.category.toLowerCase() === budget.category.toLowerCase() &&
          expenseDate.getMonth() + 1 === budget.month &&
          expenseDate.getFullYear() === budget.year
        );
      })
      .reduce((total, expense) => total + Number(expense.amount), 0);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const budgetData = {
      category,
      amount: Number(amount),
      month: Number(month),
      year: Number(year),
    };

    try {
      if (editingId) {
        await apiRequest(`/budgets/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(budgetData),
        });
      } else {
        await apiRequest("/budgets", {
          method: "POST",
          body: JSON.stringify(budgetData),
        });
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditing(budget) {
    setEditingId(budget.id);
    setCategory(budget.category);
    setAmount(String(budget.amount));
    setMonth(budget.month);
    setYear(budget.year);
  }

  function resetForm() {
    setEditingId(null);
    setCategory("Food");
    setAmount("");
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      await apiRequest(`/budgets/${id}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatMonth(monthNumber) {
    return new Date(2000, monthNumber - 1).toLocaleString("en-US", {
      month: "long",
    });
  }

  return (
    <main className="budgets-page">
      <div className="budgets-header">
        <h1>My Budgets</h1>
        <p>Set spending limits and keep track of your money.</p>
      </div>

      <section className="budget-form-card">
        <h2>{editingId ? "Edit Budget" : "Create a Budget"}</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="budget-category">Category</label>
          <select
            id="budget-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label htmlFor="budget-amount">Monthly Limit ($)</label>
          <input
            id="budget-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter budget amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />

          <div className="budget-date-fields">
            <div>
              <label htmlFor="budget-month">Month</label>
              <select
                id="budget-month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (item) => (
                    <option key={item} value={item}>
                      {formatMonth(item)}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label htmlFor="budget-year">Year</label>
              <input
                id="budget-year"
                type="number"
                min="2000"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit">
            {editingId ? "Save Changes" : "Add Budget"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </form>

        {error && <p className="budget-error">{error}</p>}
      </section>

      <section className="budget-list-section">
        <h2>Your Monthly Budgets</h2>

        {loading ? (
          <p>Loading budgets...</p>
        ) : budgets.length === 0 ? (
          <p>You haven't created any budgets yet. Add one above to get started!</p>
        ) : (
          <div className="budget-list">
            {budgets.map((budget) => {
              const spent = getSpent(budget);
              const remaining = Number(budget.amount) - spent;
              const progress = Math.min(
                (spent / Number(budget.amount)) * 100,
                100
              );

              return (
                <article className="budget-card" key={budget.id}>
                  <div className="budget-card-header">
                    <div>
                      <h3>{budget.category}</h3>
                      <p>
                        {formatMonth(budget.month)} {budget.year}
                      </p>
                    </div>

                    <div className="budget-actions">
                      <button
                        type="button"
                        onClick={() => startEditing(budget)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(budget.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="budget-numbers">
                    <span>
                      ${spent.toFixed(2)} spent
                    </span>
                    <span>
                      ${Number(budget.amount).toFixed(2)} limit
                    </span>
                  </div>

                  <div className="budget-progress-track">
                    <div
                      className="budget-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className={remaining < 0 ? "over-budget" : ""}>
                    {remaining >= 0
                      ? `$${remaining.toFixed(2)} remaining`
                      : `$${Math.abs(remaining).toFixed(2)} over budget`}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default Budgets;
