const express = require('express');
const cron = require('node-cron');

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// In-memory data storage
let expenses = [];
let idCounter = 1;

// Predefined categories
const validCategories = ["Food", "Travel", "Entertainment", "Utilities"];

// Add Expense Endpoint
app.post('/expenses', (req, res) => {
    const { category, amount, date } = req.body;

    // Validate category
    if (!validCategories.includes(category)) {
        return res.status(400).json({ status: "error", data: null, error: "Invalid category" });
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ status: "error", data: null, error: "Amount must be a positive number" });
    }

    // Add expense
    const expense = { id: idCounter++, category, amount, date };
    expenses.push(expense);

    res.status(201).json({ status: "success", data: expense, error: null });
});

// Get Expenses Endpoint
app.get('/expenses', (req, res) => {
    const { category, startDate, endDate } = req.query;
    let filteredExpenses = expenses;

    // Filter by category
    if (category) {
        filteredExpenses = filteredExpenses.filter(exp => exp.category === category);
    }

    // Filter by date range
    if (startDate && endDate) {
        filteredExpenses = filteredExpenses.filter(exp =>
            new Date(exp.date) >= new Date(startDate) &&
            new Date(exp.date) <= new Date(endDate)
        );
    }

    res.status(200).json({ status: "success", data: filteredExpenses, error: null });
});

// Analyze Spending Endpoint
app.get('/expenses/analysis', (req, res) => {
    // Calculate totals by category
    const totalByCategory = expenses.reduce((totals, exp) => {
        totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
        return totals;
    }, {});

    // Find highest spending category
    const highestSpendingCategory = Object.keys(totalByCategory).reduce((max, category) =>
        totalByCategory[category] > totalByCategory[max] ? category : max,
        Object.keys(totalByCategory)[0] || null
    );

    res.status(200).json({
        status: "success",
        data: { totalByCategory, highestSpendingCategory },
        error: null
    });
});

// Automated Summary Reports
cron.schedule('* * * * *', () => {

    console.log('Generating daily summary...');
    const dailyTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    console.log(`Daily total expense: $${dailyTotal.toFixed(2)}`);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Personal Expense Tracker API is running on http://localhost:${PORT}`);
});
