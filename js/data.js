//----------MONEY'ST DATA STORE----------
// Single source of truth for every figure in the app.
// All pages read from here, and every save/delete writes back here,
// so the dashboard, transaction, finance record and savings pages always agree.
(function () {
    const STORAGE_KEY = 'moneyst.v1';
    const FLASH_KEY = 'moneyst.flash';

    // Expense categories (same list as the New Expense form)
    const CATEGORIES = {
        food:          { label: 'Food',          icon: '🍽️', color: '#F7B6D2' },
        transport:     { label: 'Transport',     icon: '🚌', color: '#A9D9EA' },
        shopping:      { label: 'Shopping',      icon: '🛍️', color: '#FBE79A' },
        entertainment: { label: 'Entertainment', icon: '🎬', color: '#B4E7B0' },
        bills:         { label: 'Bills',         icon: '📄', color: '#C9C3F2' },
        health:        { label: 'Health',        icon: '🏥', color: '#F6C6A6' },
        education:     { label: 'Education',     icon: '📚', color: '#9FD8CB' },
        travel:        { label: 'Travel',        icon: '✈️', color: '#F3A9A0' },
        other:         { label: 'Other',         icon: '📦', color: '#D9D9D9' }
    };

    // Demo dataset: January to March 2025.
    // Balance = total income − total expenses − money moved into savings goals.
    function seed() {
        return {
            income: [
                { id: 'inc-1', amount: 3500000, date: '2025-01-01', method: 'noncash', source: 'Part-time job' },
                { id: 'inc-2', amount: 6000000, date: '2025-01-06', method: 'noncash', source: 'Scholarship' },
                { id: 'inc-3', amount: 3500000, date: '2025-02-01', method: 'noncash', source: 'Part-time job' },
                { id: 'inc-4', amount: 3500000, date: '2025-03-01', method: 'noncash', source: 'Part-time job' },
                { id: 'inc-5', amount: 1500000, date: '2025-03-15', method: 'cash',    source: 'Freelance design' }
            ],
            expenses: [
                { id: 'exp-1',  amount: 450000, date: '2025-01-10', category: 'food' },
                { id: 'exp-2',  amount: 200000, date: '2025-01-12', category: 'transport' },
                { id: 'exp-3',  amount: 250000, date: '2025-01-20', category: 'bills' },
                { id: 'exp-4',  amount: 200000, date: '2025-01-25', category: 'entertainment' },
                { id: 'exp-5',  amount: 500000, date: '2025-02-08', category: 'food' },
                { id: 'exp-6',  amount: 200000, date: '2025-02-10', category: 'transport' },
                { id: 'exp-7',  amount: 350000, date: '2025-02-14', category: 'shopping' },
                { id: 'exp-8',  amount: 250000, date: '2025-02-20', category: 'bills' },
                { id: 'exp-9',  amount: 550000, date: '2025-03-02', category: 'food' },
                { id: 'exp-10', amount: 250000, date: '2025-03-03', category: 'transport' },
                { id: 'exp-11', amount: 450000, date: '2025-03-08', category: 'entertainment' },
                { id: 'exp-12', amount: 250000, date: '2025-03-20', category: 'bills' }
            ],
            goals: [
                { id: 'goal-1', name: 'Gaming PC',  description: 'I really need the new gaming PC',             target: 20000000, startDate: '2025-01-01', targetDate: '2025-06-30' },
                { id: 'goal-2', name: 'PS5',        description: 'I really want the console to play games 😎😎', target: 10000000, startDate: '2025-01-01', targetDate: '2025-06-30' },
                { id: 'goal-3', name: 'New Laptop', description: 'A faster laptop for college assignments',     target: 15000000, startDate: '2025-01-01', targetDate: '2025-12-31' },
                { id: 'goal-4', name: 'Game top-up', description: 'Top-up for the new season pass',             target: 500000,   startDate: '2025-03-01', targetDate: '2025-04-30' }
            ],
            // Money moved into a goal. A goal's saved amount is the sum of its contributions.
            contributions: [
                { id: 'con-1', goalId: 'goal-1', amount: 3000000, date: '2025-01-05' },
                { id: 'con-2', goalId: 'goal-3', amount: 1500000, date: '2025-01-07' },
                { id: 'con-3', goalId: 'goal-1', amount: 2500000, date: '2025-02-03' },
                { id: 'con-4', goalId: 'goal-2', amount: 1000000, date: '2025-02-05' },
                { id: 'con-5', goalId: 'goal-1', amount: 1500000, date: '2025-03-01' },
                { id: 'con-6', goalId: 'goal-3', amount: 1500000, date: '2025-03-02' },
                { id: 'con-7', goalId: 'goal-2', amount: 500000,  date: '2025-03-05' },
                { id: 'con-8', goalId: 'goal-4', amount: 300000,  date: '2025-03-07' }
            ]
        };
    }

    // ---------- Storage ----------
    let memory = null; // fallback when localStorage is unavailable

    function readStorage(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function writeStorage(key, value) {
        try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
    }

    function isValidState(state) {
        return state && Array.isArray(state.income) && Array.isArray(state.expenses) &&
            Array.isArray(state.goals) && Array.isArray(state.contributions);
    }

    // Bring in records saved by the older versions of the add forms
    function importLegacy(state) {
        try {
            const oldExpenses = JSON.parse(readStorage('expenses') || '[]');
            oldExpenses.forEach(function (e) {
                if (e && e.amount > 0 && e.date) {
                    state.expenses.push({ id: 'exp-' + e.id, amount: e.amount, date: e.date, category: CATEGORIES[e.category] ? e.category : 'other' });
                }
            });
            const oldGoals = JSON.parse(readStorage('savingsData') || '[]');
            oldGoals.forEach(function (g) {
                if (g && g.name && g.goal > 0) {
                    state.goals.push({ id: 'goal-' + g.id, name: g.name, description: g.description || '', target: g.goal,
                        startDate: (g.createdAt || '').slice(0, 10) || todayISO(), targetDate: g.targetDate || '' });
                }
            });
        } catch (e) { /* ignore unreadable legacy data */ }
        return state;
    }

    function load() {
        if (memory) return memory;
        let state = null;
        try { state = JSON.parse(readStorage(STORAGE_KEY)); } catch (e) { state = null; }
        if (!isValidState(state)) {
            state = importLegacy(seed());
            writeStorage(STORAGE_KEY, JSON.stringify(state));
        }
        memory = state;
        return state;
    }

    function save(state) {
        memory = state;
        writeStorage(STORAGE_KEY, JSON.stringify(state));
    }

    function newId(prefix) {
        return prefix + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
    }

    // ---------- Dates ----------
    function todayISO() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // Parse "YYYY-MM-DD" as a local date (avoids timezone shifts)
    function parseDate(iso) {
        const p = String(iso).split('-').map(Number);
        return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
    }

    function formatDate(iso) {
        return parseDate(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    function formatShortDate(iso) {
        return parseDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function monthKey(iso) { return String(iso).slice(0, 7); }

    function formatMonth(key) {
        return parseDate(key + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // ---------- Money ----------
    function formatRupiah(amount) {
        const sign = amount < 0 ? '−' : '';
        return sign + 'Rp ' + Math.round(Math.abs(amount)).toLocaleString('id-ID');
    }

    function sum(list) {
        return list.reduce(function (total, item) { return total + item.amount; }, 0);
    }

    // ---------- Queries ----------
    function goalSaved(goalId) {
        return sum(load().contributions.filter(function (c) { return c.goalId === goalId; }));
    }

    function goalProgress(goal) {
        const saved = goalSaved(goal.id);
        const percent = goal.target > 0 ? Math.min(100, Math.round((saved / goal.target) * 100)) : 0;
        return { saved: saved, target: goal.target, percent: percent, complete: saved >= goal.target };
    }

    function totals() {
        const s = load();
        const income = sum(s.income);
        const expense = sum(s.expenses);
        const saved = sum(s.contributions);
        return { income: income, expense: expense, saved: saved, balance: income - expense - saved };
    }

    function inMonth(list, key) {
        return list.filter(function (item) { return monthKey(item.date) === key; });
    }

    // Most recent month that has any income or expense (falls back to this month)
    function latestMonth() {
        const s = load();
        const dates = s.income.concat(s.expenses).map(function (r) { return r.date; }).sort();
        return dates.length ? monthKey(dates[dates.length - 1]) : todayISO().slice(0, 7);
    }

    function byCategory(expenses) {
        const groups = {};
        expenses.forEach(function (e) {
            groups[e.category] = (groups[e.category] || 0) + e.amount;
        });
        return Object.keys(groups)
            .map(function (key) {
                const meta = CATEGORIES[key] || CATEGORIES.other;
                return { key: key, label: meta.label, icon: meta.icon, color: meta.color, amount: groups[key] };
            })
            .sort(function (a, b) { return b.amount - a.amount; });
    }

    function newestFirst(list) {
        return list.slice().sort(function (a, b) {
            return a.date === b.date ? String(b.id).localeCompare(String(a.id)) : (a.date < b.date ? 1 : -1);
        });
    }

    // ---------- Mutations ----------
    const COLLECTIONS = { income: 'income', expense: 'expenses', goal: 'goals' };

    function add(type, record) {
        const state = load();
        const item = Object.assign({ id: newId(type) }, record);
        state[COLLECTIONS[type]].push(item);
        save(state);
        return item;
    }

    // Returns everything needed to undo the removal
    function remove(type, id) {
        const state = load();
        const list = state[COLLECTIONS[type]];
        const index = list.findIndex(function (r) { return r.id === id; });
        if (index < 0) return null;
        const removed = { type: type, record: list.splice(index, 1)[0], contributions: [] };
        if (type === 'goal') {
            removed.contributions = state.contributions.filter(function (c) { return c.goalId === id; });
            state.contributions = state.contributions.filter(function (c) { return c.goalId !== id; });
        }
        save(state);
        return removed;
    }

    function restore(removed) {
        if (!removed) return;
        const state = load();
        state[COLLECTIONS[removed.type]].push(removed.record);
        state.contributions = state.contributions.concat(removed.contributions);
        save(state);
    }

    // Apply changes to a record; returns the previous values of the changed fields (for undo)
    function update(type, id, changes) {
        const state = load();
        const record = state[COLLECTIONS[type]].find(function (r) { return r.id === id; });
        if (!record) return null;
        const before = {};
        Object.keys(changes).forEach(function (key) { before[key] = record[key]; });
        Object.assign(record, changes);
        save(state);
        return before;
    }

    function find(type, id) {
        return load()[COLLECTIONS[type]].find(function (r) { return r.id === id; }) || null;
    }

    // ---------- Labels ----------
    function incomeLabel(income) {
        if (income.source) return income.source;
        return income.method === 'cash' ? 'Cash income' : 'Non-cash income';
    }

    function categoryMeta(key) {
        return CATEGORIES[key] || CATEGORIES.other;
    }

    // ---------- Cross-page message (shown as a toast after a redirect) ----------
    function setFlash(flash) {
        try { sessionStorage.setItem(FLASH_KEY, JSON.stringify(flash)); } catch (e) { /* ignore */ }
    }

    function takeFlash() {
        try {
            const raw = sessionStorage.getItem(FLASH_KEY);
            sessionStorage.removeItem(FLASH_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    window.Moneyst = {
        CATEGORIES: CATEGORIES,
        load: load,
        totals: totals,
        goalSaved: goalSaved,
        goalProgress: goalProgress,
        inMonth: inMonth,
        latestMonth: latestMonth,
        byCategory: byCategory,
        newestFirst: newestFirst,
        sum: sum,
        add: add,
        remove: remove,
        update: update,
        restore: restore,
        find: find,
        incomeLabel: incomeLabel,
        categoryMeta: categoryMeta,
        todayISO: todayISO,
        parseDate: parseDate,
        monthKey: monthKey,
        formatDate: formatDate,
        formatShortDate: formatShortDate,
        formatMonth: formatMonth,
        formatRupiah: formatRupiah,
        setFlash: setFlash,
        takeFlash: takeFlash
    };
})();
