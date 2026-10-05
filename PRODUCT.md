# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The general public: anyone who wants simple personal budgeting. They come to record what money comes in and goes out, see where it goes, and save toward specific goals. They are not assumed to have any finance knowledge.

## Product Purpose

Money'st ("Moneyst") is a personal finance tracker. People can record income and expenses, review their overall finance record by day, week, and month, and set up savings goals with progress tracking. Success means a user can log a transaction, understand their balance, and see how close they are to a savings goal without any help.

This is an HCI course prototype (AOL assignment, HCI LEC). It exists to demonstrate sound interaction design and usability principles. It is not a shipping product.

## Positioning

Simple, goal-oriented saving for everyday people. Savings are framed around concrete things the user wants (the demo data uses a Gaming PC, a New Laptop, and a PS5), not abstract budgets.

## Operating Context

- Pages for logged-out users: landing (`index.html`), Help (`helpBef.html`), Contact (`ContactBef.html`), Login (`loginBef.html`), Sign Up (`SignUpBef.html`).
- Pages for logged-in users: Dashboard (`home.html`), Transaction (`transaction.html`, `addIncome.html`, `addExpense.html`), Finance Record (`financeRecord.html`), Savings (`savings.html`, `addSavings.html`, `viewSavings.html`), Help (`help.html`), Contact (`Contact.html`), Login (`login.html`), Sign Up (`SignUp.html`).
- Main navigation: Home, Transaction, Savings, Help, Contact Us.

## Capabilities and Constraints

- Static HTML/CSS/JS with no framework, no build step, and no backend. Data is hardcoded demo content. Login and sign-up are simulated.
- Shared stylesheets: `style.css` and `style2.css`. Scripts: `script.js`, `script2.js`, `script3.js`.
- Currency is Indonesian Rupiah (Rp).
- **Interface language: fully English.** Some copy is still in Indonesian (landing tagline, Help FAQ, savings welcome text, month labels such as "MARET"). Future work should translate it to English rather than adding more Indonesian copy.
- Undecided: whether the logged-out and logged-in page pairs stay as separate files.

## Brand Commitments

- Name: Money'st. The spelling varies across pages ("Money'st", "Money’st", "Moneyst"). Which spelling is canonical has not been decided.
- Existing logo: `DASHBOARD PAGE/logo.jpg` and `S1P2/logo.jpg`.

## Evidence on Hand

- Image assets in `CONTACT PAGE/`, `DASHBOARD PAGE/` (including `video.mp4`), `LOGIN PAGE/` (Google, Facebook, and Apple sign-in icons), `PAGE HELP/`, and `S1P1/` through `S1P8/` (charts, savings progress art).
- Every figure is demo data. There are no real users, testimonials, or metrics, and none should be invented. The Help page's claims about encryption and a free service are prototype copy, not verified facts.

## Product Principles

1. Clarity over features: a non-expert should understand their money at a glance.
2. Savings feel tangible: goals are named things with visible progress.
3. Logging money is fast: adding income or an expense should take seconds.
4. Usability is the grade: every screen should be defensible against HCI heuristics (consistency, feedback, error prevention, recognition over recall).
