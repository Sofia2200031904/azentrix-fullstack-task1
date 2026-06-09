# Sofia's PennyPilot - Personal Budget Tracker

A responsive, interactive personal budget tracker built for Azentrix Full Stack Developer Intern Task 1. Sofia's PennyPilot gives individuals a focused place to record income and expenses, review monthly cash flow, and understand their largest spending categories.

## Default Login

- Username: `user`
- Password: `User@123`

## Features

- Add, edit, and delete income and expense transactions
- Record a description, amount, category, type, and date
- Monthly balance, total income, and total expense summary
- Clickable cash-flow bar chart drawn with the Canvas API
- Clickable category-wise expense donut chart and ranked spending breakdown
- Search transactions and filter by income or expense
- Export the selected month's visible transactions to CSV
- Persistent light and dark modes
- Toast notifications after important actions
- Persistent transaction data with `localStorage`
- Responsive desktop, tablet, and mobile layouts
- Session persistence with `sessionStorage`

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API for chart rendering
- Browser `localStorage` and `sessionStorage`

The project intentionally has no build step or third-party JavaScript dependency. This keeps setup quick and makes the implementation easy to review.

## Setup

1. Clone the repository using the requested Task 1 name:

   ```bash
   git clone <repository-url> azentrix-fullstack-task1
   cd azentrix-fullstack-task1
   ```

2. Start any static file server. For example, with Python:

   ```bash
   python -m http.server 4173
   ```

3. Open [http://localhost:4173](http://localhost:4173) and sign in using `user / User@123`.

The app can also be opened directly from `index.html`, although a local static server is recommended.

## Approach

The app is organized into three small files:

- `index.html` contains the accessible application structure, login screen, dashboard, table, and transaction dialog.
- `styles.css` defines the visual system and responsive breakpoints.
- `app.js` manages authentication, CRUD operations, monthly filtering, derived summaries, chart rendering, and browser storage.

Transactions are saved in `localStorage`. Dashboard values are derived from the selected month's transactions every time data changes, keeping the cards, category breakdown, chart, and transaction list consistent.

## Public Link 
**https://azentrix-fullstack-task1-nu.vercel.app/**

## Video Demo

Loom demo link: **Add the recorded Loom link here before submission.**


