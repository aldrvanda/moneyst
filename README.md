# Money'st

A personal finance tracker for the web. Record your income and expenses, see where your money goes, and save toward the things you want, like a gaming PC or a new laptop.

## About this project

Money'st is a **group project** for the **Human Computer Interaction** course (lecture class, semester 2) at **Bina Nusantara University**, submitted as our AOL (Assurance of Learning) assignment.

The goal was to design and build a usable interface and to apply HCI principles throughout: Nielsen's usability heuristics, consistency, feedback, error prevention, and recognition over recall.

**My role:** I coded the website. I built the pages, styling and interactions in HTML, CSS and JavaScript from the group's designs.

## Features

- **Dashboard:** balance, income, savings and expenses at a glance, plus an expense breakdown by category for the last 3 months, 6 months or all time.
- **Transactions:** add income and expenses, then see category and weekly charts for any month.
- **Finance record:** the full history, filtered by month, week or day, with delete and undo.
- **Savings goals:** create, edit and delete goals, and track progress toward each target. Includes a calendar of the days you saved, monthly progress, and saved-vs-spent analytics.
- **Help and Contact pages**, plus login and sign-up forms with validation.
- **Responsive:** works on desktop, tablet and phone. On phones the navigation becomes a bottom tab bar.

All figures and charts come from a single data store, so every page shows the same numbers. Anything you add, edit or delete updates everywhere straight away.

## Try it

No installation or build step is needed.

1. Download or clone this repository.
2. Open `index.html` in your browser for the logged-out landing page, or `home.html` to go straight to the dashboard.

Demo login: `demo@money.st` / `demo1234`. Any valid email with a password of 8 or more characters also works, because login is simulated.

## How the data works

This is a front-end prototype with **no backend**.

- The app starts with a demo dataset covering January–March 2025, stored in your browser's `localStorage` under the key `moneyst.v1`.
- Whatever you add stays in that browser only.
- To reset to the demo data, clear the site data in your browser, or run `localStorage.removeItem('moneyst.v1')` in the browser console.

## Project structure

```
├── index.html            Landing page (logged out)
├── home.html             Dashboard
├── transaction.html      Transactions and charts
├── addIncome.html        New income form
├── addExpense.html       New expense form
├── financeRecord.html    Income and expense history
├── savings.html          Savings overview and analytics
├── addSavings.html       Create / edit a saving goal
├── viewSavings.html      All saving goals
├── help.html, Contact.html, login.html, SignUp.html
├── *Bef.html             Logged-out versions of Help, Contact, Login and Sign Up
├── css/
│   ├── style.css         Base styles (dashboard, transactions, forms, auth, contact)
│   ├── style2.css        Savings, help and login styles
│   ├── components.css    Charts, calendar, toasts and other data-driven components
│   └── responsive.css    Tablet and phone layouts, bottom tab bar
├── js/
│   ├── data.js           Shared data store (demo data, totals, add / edit / delete)
│   ├── pages.js          Renders every page's numbers and charts from the store
│   ├── script.js         Sign-up and add-income logic
│   ├── script2.js        Saving goal form and help page logic
│   └── script3.js        Add-expense, login and contact logic
└── assets/
    ├── images/
    └── video/
```

## Built with

HTML, CSS and vanilla JavaScript. There are no frameworks or dependencies, apart from Google Fonts (Poppins, Righteous) and Font Awesome for one icon.
