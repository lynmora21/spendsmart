from datetime import date, datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import CheckConstraint, Numeric

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    expenses = db.relationship(
        "Expense", back_populates="user", cascade="all, delete-orphan"
    )
    budgets = db.relationship(
        "Budget", back_populates="user", cascade="all, delete-orphan"
    )


class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    amount = db.Column(Numeric(10, 2), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    expense_date = db.Column(db.Date, nullable=False, default=date.today)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user = db.relationship("User", back_populates="expenses")

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_expense_amount_positive"),
    )


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(Numeric(10, 2), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user = db.relationship("User", back_populates="budgets")

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_budget_amount_positive"),
        CheckConstraint("month >= 1 AND month <= 12", name="check_budget_month"),
        CheckConstraint("year >= 2000", name="check_budget_year"),
        db.UniqueConstraint(
            "user_id", "category", "month", "year",
            name="unique_user_category_month_budget",
        ),
    )
