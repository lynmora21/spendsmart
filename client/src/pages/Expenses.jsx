
import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "Food",
    expense_date: new Date().toLocaleDateString("en-CA"),
    notes: "",
  });

  const categories = [
    "Food",
    "Transportation",
    "Housing",
    "Shopping",
    "Entertainment",
    "Utilities",
    "Health",
    "Other",
  ];

  async function fetchExpenses() {
    try {
      setError("");
      const data = await apiRequest("/expenses");
      setExpenses(data.expenses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function resetForm() {
    setFormData({
      title: "",
      amount: "",
      category: "Food",
      expense_date: new Date().toLocaleDateString("en-CA"),
      notes: "",
    });
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (editingId) {
        await apiRequest(`/expenses/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/expenses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await fetchExpenses();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEdit(expense) {
    setEditingId(expense.id);

    setFormData({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      expense_date: expense.expense_date,
      notes: expense.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    try {
      setError("");
      await apiRequest(`/expenses/${id}`, {
        method: "DELETE",
      });

      setExpenses((previous) =>
        previous.filter((expense) => expense.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  if (loading) {
    return <div className="page-content">Loading expenses...</div>;
  }

  return (
    <div className="page-content expenses-page">
      <div className="expenses-header">
        <div>
          <p className="expenses-eyebrow">YOUR FINANCES</p>
          <h1>My Expenses</h1>
          <p>Keep track of where your money goes.</p>
        </div>
      </div>

      <div className="expense-summary">
        <div>
          <p>Total Expenses</p>
          <h2>
            {totalExpenses.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </h2>
        </div>

        <div>
          <p>Transactions</p>
          <h2>{expenses.length}</h2>
        </div>
      </div>

      {error && <div className="expense-error">{error}</div>}

      <div className="expense-form-card">
        <h2>{editingId ? "Edit Expense" : "Add a New Expense"}</h2>

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="expense-form-grid">
            <label>
              Expense Name
              <input
                type="text"
                name="title"
                placeholder="e.g. Groceries"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Amount ($)
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Category
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            Notes (Optional)
            <textarea
              name="notes"
              placeholder="Add any additional details..."
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </label>

          <div className="expense-form-actions">
            <button type="submit" className="expense-submit-btn">
              {editingId ? "Save Changes" : "Add Expense"}
            </button>

            {editingId && (
              <button
                type="button"
                className="expense-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="expense-list-section">
        <h2>Recent Transactions</h2>

        {expenses.length === 0 ? (
          <div className="expense-empty">
            <h3>No expenses yet</h3>
            <p>Add your first expense using the form above.</p>
          </div>
        ) : (
          <div className="expense-list">
            {expenses.map((expense) => (
              <div className="expense-item" key={expense.id}>
                <div className="expense-item-info">
                  <div className="expense-category-icon">
                    {expense.category === "Food"
                      ? "🍃"
                      : expense.category === "Transportation"
                      ? "🚗"
                      : expense.category === "Shopping"
                      ? "🛍️"
                      : "💳"}
                  </div>

                  <div>
                    <h3>{expense.title}</h3>
                    <p>
                      {expense.category} · {expense.expense_date}
                    </p>
                    {expense.notes && (
                      <p className="expense-notes">{expense.notes}</p>
                    )}
                  </div>
                </div>

                <div className="expense-item-actions">
                  <strong>
                    {Number(expense.amount).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </strong>

                  <button onClick={() => handleEdit(expense)}>
                    Edit
                  </button>

                  <button
                    className="expense-delete-btn"
                    onClick={() => handleDelete(expense.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Expenses;
