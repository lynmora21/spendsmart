import os
from pathlib import Path
from datetime import date
from decimal import Decimal, InvalidOperation

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, User, Expense, Budget

load_dotenv(Path(__file__).resolve().parent / ".env")


def create_app():
    app = Flask(__name__)

    database_path = Path(__file__).resolve().parent / "spendsmart.db"
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", f"sqlite:///{database_path}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    if not app.config["JWT_SECRET_KEY"]:
        raise RuntimeError("JWT_SECRET_KEY must be set in server/.env")

    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    # HEALTH CHECK
    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "message": "SpendSmart API is running",
        })

    # REGISTER
    @app.post("/api/auth/register")
    def register():
        data = request.get_json() or {}

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not name or not email or not password:
            return jsonify({"error": "All fields are required"}), 400

        if len(password) < 8:
            return jsonify({
                "error": "Password must be at least 8 characters"
            }), 400

        existing_user = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()

        if existing_user:
            return jsonify({
                "error": "An account with this email already exists"
            }), 409

        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
        )

        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id))

        return jsonify({
            "message": "Account created successfully",
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
            },
        }), 201

    # LOGIN
    @app.post("/api/auth/login")
    def login():
        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        user = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()

        if not user or not check_password_hash(
            user.password_hash, password
        ):
            return jsonify({"error": "Invalid email or password"}), 401

        token = create_access_token(identity=str(user.id))

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
            },
        }), 200

    # CURRENT USER
    @app.get("/api/auth/me")
    @jwt_required()
    def current_user():
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
            }
        }), 200

    # -------------------------
    # EXPENSE ROUTES
    # -------------------------

    # GET ALL EXPENSES
    @app.get("/api/expenses")
    @jwt_required()
    def get_expenses():
        user_id = int(get_jwt_identity())

        expenses = db.session.execute(
            db.select(Expense)
            .filter_by(user_id=user_id)
            .order_by(Expense.expense_date.desc())
        ).scalars().all()

        return jsonify({
            "expenses": [
                {
                    "id": expense.id,
                    "title": expense.title,
                    "amount": float(expense.amount),
                    "category": expense.category,
                    "expense_date": expense.expense_date.isoformat(),
                    "notes": expense.notes,
                }
                for expense in expenses
            ]
        }), 200

    # CREATE EXPENSE
    @app.post("/api/expenses")
    @jwt_required()
    def create_expense():
        data = request.get_json() or {}

        title = data.get("title", "").strip()
        category = data.get("category", "").strip()
        amount_value = data.get("amount")
        expense_date_value = data.get("expense_date")
        notes = data.get("notes", "").strip()

        if not title or not category or amount_value is None:
            return jsonify({
                "error": "Title, category, and amount are required"
            }), 400

        try:
            amount = Decimal(str(amount_value))
            if not amount.is_finite() or amount <= 0:
                raise InvalidOperation
        except (InvalidOperation, ValueError):
            return jsonify({
                "error": "Amount must be a valid number greater than zero"
            }), 400

        try:
            expense_date = (
                date.fromisoformat(expense_date_value)
                if expense_date_value
                else date.today()
            )
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid expense date"}), 400

        expense = Expense(
            title=title,
            amount=amount,
            category=category,
            expense_date=expense_date,
            notes=notes,
            user_id=int(get_jwt_identity()),
        )

        db.session.add(expense)
        db.session.commit()

        return jsonify({
            "message": "Expense created successfully",
            "expense": {
                "id": expense.id,
                "title": expense.title,
                "amount": float(expense.amount),
                "category": expense.category,
                "expense_date": expense.expense_date.isoformat(),
                "notes": expense.notes,
            },
        }), 201

    # UPDATE EXPENSE
    @app.patch("/api/expenses/<int:expense_id>")
    @jwt_required()
    def update_expense(expense_id):
        user_id = int(get_jwt_identity())

        expense = db.session.execute(
            db.select(Expense).filter_by(
                id=expense_id,
                user_id=user_id,
            )
        ).scalar_one_or_none()

        if not expense:
            return jsonify({"error": "Expense not found"}), 404

        data = request.get_json() or {}

        if "title" in data:
            title = data["title"].strip()
            if not title:
                return jsonify({"error": "Title cannot be empty"}), 400
            expense.title = title

        if "category" in data:
            category = data["category"].strip()
            if not category:
                return jsonify({"error": "Category cannot be empty"}), 400
            expense.category = category

        if "amount" in data:
            try:
                amount = Decimal(str(data["amount"]))
                if not amount.is_finite() or amount <= 0:
                    raise InvalidOperation
                expense.amount = amount
            except (InvalidOperation, ValueError):
                return jsonify({"error": "Invalid amount"}), 400

        if "expense_date" in data:
            try:
                expense.expense_date = date.fromisoformat(
                    data["expense_date"]
                )
            except (TypeError, ValueError):
                return jsonify({"error": "Invalid expense date"}), 400

        if "notes" in data:
            expense.notes = data["notes"].strip()

        db.session.commit()

        return jsonify({
            "message": "Expense updated successfully",
            "expense": {
                "id": expense.id,
                "title": expense.title,
                "amount": float(expense.amount),
                "category": expense.category,
                "expense_date": expense.expense_date.isoformat(),
                "notes": expense.notes,
            },
        }), 200

    # DELETE EXPENSE
    @app.delete("/api/expenses/<int:expense_id>")
    @jwt_required()
    def delete_expense(expense_id):
        user_id = int(get_jwt_identity())

        expense = db.session.execute(
            db.select(Expense).filter_by(
                id=expense_id,
                user_id=user_id,
            )
        ).scalar_one_or_none()

        if not expense:
            return jsonify({"error": "Expense not found"}), 404

        db.session.delete(expense)
        db.session.commit()

        return jsonify({
            "message": "Expense deleted successfully"
        }), 200

    # -------------------------
    # BUDGET ROUTES
    # -------------------------

    # GET ALL BUDGETS
    @app.get("/api/budgets")
    @jwt_required()
    def get_budgets():
        user_id = int(get_jwt_identity())

        budgets = db.session.execute(
            db.select(Budget)
            .filter_by(user_id=user_id)
            .order_by(Budget.year.desc(), Budget.month.desc())
        ).scalars().all()

        return jsonify({
            "budgets": [
                {
                    "id": budget.id,
                    "category": budget.category,
                    "amount": float(budget.amount),
                    "month": budget.month,
                    "year": budget.year,
                }
                for budget in budgets
            ]
        }), 200

    # CREATE BUDGET
    @app.post("/api/budgets")
    @jwt_required()
    def create_budget():
        data = request.get_json() or {}
        user_id = int(get_jwt_identity())

        category = data.get("category", "").strip()

        try:
            amount = Decimal(str(data.get("amount")))
            month = int(data.get("month"))
            year = int(data.get("year"))

            if not amount.is_finite() or amount <= 0:
                raise ValueError

            if month < 1 or month > 12 or year < 2000:
                raise ValueError

        except (InvalidOperation, ValueError, TypeError):
            return jsonify({
                "error": "Enter a valid amount, month, and year"
            }), 400

        if not category:
            return jsonify({"error": "Category is required"}), 400

        existing = db.session.execute(
            db.select(Budget).filter_by(
                user_id=user_id,
                category=category,
                month=month,
                year=year,
            )
        ).scalar_one_or_none()

        if existing:
            return jsonify({
                "error": "A budget already exists for this category and month"
            }), 409

        budget = Budget(
            category=category,
            amount=amount,
            month=month,
            year=year,
            user_id=user_id,
        )

        db.session.add(budget)
        db.session.commit()

        return jsonify({
            "message": "Budget created successfully",
            "budget": {
                "id": budget.id,
                "category": budget.category,
                "amount": float(budget.amount),
                "month": budget.month,
                "year": budget.year,
            },
        }), 201

    # UPDATE BUDGET
    @app.patch("/api/budgets/<int:budget_id>")
    @jwt_required()
    def update_budget(budget_id):
        user_id = int(get_jwt_identity())

        budget = db.session.execute(
            db.select(Budget).filter_by(
                id=budget_id,
                user_id=user_id,
            )
        ).scalar_one_or_none()

        if not budget:
            return jsonify({"error": "Budget not found"}), 404

        data = request.get_json() or {}

        category = data.get("category", budget.category)
        try:
            category = category.strip()
            amount = Decimal(str(data.get("amount", budget.amount)))
            month = int(data.get("month", budget.month))
            year = int(data.get("year", budget.year))

            if not category or not amount.is_finite() or amount <= 0:
                raise ValueError

            if month < 1 or month > 12 or year < 2000:
                raise ValueError

        except (InvalidOperation, ValueError, TypeError):
            return jsonify({"error": "Invalid budget information"}), 400

        duplicate = db.session.execute(
            db.select(Budget).filter(
                Budget.user_id == user_id,
                Budget.category == category,
                Budget.month == month,
                Budget.year == year,
                Budget.id != budget_id,
            )
        ).scalar_one_or_none()

        if duplicate:
            return jsonify({
                "error": "A budget already exists for this category and month"
            }), 409

        budget.category = category
        budget.amount = amount
        budget.month = month
        budget.year = year

        db.session.commit()

        return jsonify({
            "message": "Budget updated successfully",
            "budget": {
                "id": budget.id,
                "category": budget.category,
                "amount": float(budget.amount),
                "month": budget.month,
                "year": budget.year,
            },
        }), 200

    # DELETE BUDGET
    @app.delete("/api/budgets/<int:budget_id>")
    @jwt_required()
    def delete_budget(budget_id):
        user_id = int(get_jwt_identity())

        budget = db.session.execute(
            db.select(Budget).filter_by(
                id=budget_id,
                user_id=user_id,
            )
        ).scalar_one_or_none()

        if not budget:
            return jsonify({"error": "Budget not found"}), 404

        db.session.delete(budget)
        db.session.commit()

        return jsonify({
            "message": "Budget deleted successfully"
        }), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=5000)