# SpendSmart – Personal Finance & Budgeting Application

## Overview

SpendSmart is a full-stack personal finance application designed to help users manage their spending, organize expenses, and stay within their monthly budgets.

The application provides a centralized dashboard where users can track their expenses, create category-based budgets, and monitor their financial progress. SpendSmart aims to make personal budgeting more organized, accessible, and easier to understand.

## Features

- **User Authentication:** Create an account, log in securely, and access personal financial information.
- **Dashboard:** View monthly expenses, budget totals, and remaining budget at a glance.
- **Expense Management:** Add, view, edit, and delete expenses.
- **Budget Management:** Create, update, and delete monthly budgets by spending category.
- **Spending Tracking:** Automatically calculate spending within each budget category.
- **Budget Progress:** View how much of each budget has been spent and how much remains.
- **User-Specific Data:** Keep expenses and budgets associated with the authenticated user.

## Technologies Used

**Frontend**
- React
- JavaScript
- Vite
- CSS

**Backend**
- Python
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- Flask-CORS

**Database**
- SQLite

## Project Structure

```text
spendsmart/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   └── package.json
│
├── server/
│   ├── migrations/
│   ├── app.py
│   ├── models.py
│   └── requirements.txt
│
└── README.md
```

## Getting Started

Follow these instructions to run SpendSmart locally.

### Prerequisites

- Node.js and npm
- Python 3
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/lynmora21/spendsmart.git
cd spendsmart
```

### 2. Set Up the Backend

Navigate to the server folder:

```bash
cd server
```

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `server` folder with:

```env
JWT_SECRET_KEY=your-secret-key
```

Replace `your-secret-key` with a securely generated secret.

Initialize or update the database:

```bash
flask --app app db upgrade
```

Start the Flask server:

```bash
python app.py
```

The backend will run at:

`http://127.0.0.1:5000`

### 3. Set Up the Frontend

Open a second terminal window and navigate to the client folder:

```bash
cd spendsmart/client
```

Install dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

The frontend will run at:

`http://localhost:5173`

## API Functionality

SpendSmart uses RESTful API endpoints to manage user accounts, expenses, and budgets.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/expenses` | Retrieve expenses |
| POST | `/api/expenses` | Create an expense |
| PATCH | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/budgets` | Retrieve budgets |
| POST | `/api/budgets` | Create a budget |
| PATCH | `/api/budgets/:id` | Update a budget |
| DELETE | `/api/budgets/:id` | Delete a budget |

## Learning Outcomes

Building SpendSmart provided an opportunity to apply full-stack development concepts, including:

- Connecting a React frontend to a Flask backend.
- Designing and managing relational database models.
- Implementing user authentication with JWT.
- Building RESTful API endpoints.
- Performing CRUD operations.
- Managing application state and displaying dynamic data.
- Organizing a full-stack application into separate frontend and backend environments.

## Future Improvements

Potential future enhancements include:

- Expense charts and spending visualizations.
- Customizable savings goals.
- Recurring expense tracking.
- Monthly spending reports.
- Additional financial insights and recommendations.

---

**Developed as a Full-Stack Capstone Project.**

