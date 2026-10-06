//----------MONEY'ST PAGE RENDERING----------
// Draws every figure, list and chart from the shared store in data.js.
// Each renderer only runs when its container exists on the current page.
(function () {
    const M = window.Moneyst;
    if (!M) return;

    const rp = M.formatRupiah;

    // ---------- DOM helpers ----------
    // el('div', { class: 'x', text: 'y' }, [children]) — text is always set safely
    function el(tag, attrs, children) {
        const node = document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) {
            const value = attrs[key];
            if (value === null || value === undefined || value === false) return;
            if (key === 'class') node.className = value;
            else if (key === 'text') node.textContent = value;
            else if (key === 'style') node.setAttribute('style', value);
            else if (key.indexOf('on') === 0) node.addEventListener(key.slice(2), value);
            else node.setAttribute(key, value);
        });
        (children || []).forEach(function (child) {
            if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        });
        return node;
    }

    function byId(id) { return document.getElementById(id); }

    function setText(id, text) {
        const node = byId(id);
        if (node) node.textContent = text;
    }

    function fill(container, nodes) {
        container.replaceChildren.apply(container, nodes);
    }

    function percentOf(part, whole) {
        return whole > 0 ? Math.round((part / whole) * 100) : 0;
    }

    function emptyState(message, link) {
        return el('div', { class: 'mst-empty' }, [
            el('p', { text: message }),
            link ? el('a', { href: link.href, class: 'mst-empty-link', text: link.label }) : null
        ]);
    }

    function progressBar(trackClass, fillClass, percent, label) {
        return el('div', {
            class: trackClass, role: 'progressbar', 'aria-label': label,
            'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(percent)
        }, [el('div', { class: fillClass, style: 'width: ' + percent + '%' })]);
    }

    // conic-gradient donut from [{ color, amount }]
    function donutGradient(slices, total) {
        if (!total) return '#ECECEC';
        let start = 0;
        const stops = slices.map(function (s) {
            const end = start + (s.amount / total) * 360;
            const stop = s.color + ' ' + start.toFixed(2) + 'deg ' + end.toFixed(2) + 'deg';
            start = end;
            return stop;
        });
        return 'conic-gradient(' + stops.join(', ') + ')';
    }

    function monthsBetween(fromKey, toKey) {
        const a = fromKey.split('-').map(Number);
        const b = toKey.split('-').map(Number);
        return (b[0] - a[0]) * 12 + (b[1] - a[1]) + 1;
    }

    // The n month keys ending at endKey, oldest first
    function monthsBack(endKey, n) {
        const parts = endKey.split('-').map(Number);
        const keys = [];
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(parts[0], parts[1] - 1 - i, 1);
            keys.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
        }
        return keys;
    }

    function addDays(iso, days) {
        const d = M.parseDate(iso);
        d.setDate(d.getDate() + days);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function bindOnce(node, event, handler) {
        if (!node || node.dataset.bound) return;
        node.dataset.bound = '1';
        node.addEventListener(event, handler);
    }

    // View state that survives re-renders (calendar month, analytics year, period anchors)
    const ui = { calMonth: null, year: null, anchorUsed: {} };

    function shortMonth(key) {
        return M.parseDate(key + '-01').toLocaleDateString('en-US', { month: 'short' });
    }

    function compactRupiah(amount) {
        if (amount >= 1000000) return (amount / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
        if (amount >= 1000) return Math.round(amount / 1000) + 'K';
        return String(amount);
    }

    // ---------- Toast (with optional Undo) ----------
    let toastTimer = null;

    function toast(message, onUndo) {
        let box = byId('mst-toast');
        if (!box) {
            box = el('div', { id: 'mst-toast', class: 'mst-toast', role: 'status', 'aria-live': 'polite' });
            document.body.appendChild(box);
        }
        const children = [el('span', { class: 'mst-toast-text', text: message })];
        if (onUndo) {
            children.push(el('button', {
                type: 'button', class: 'mst-toast-undo', text: 'Undo',
                onclick: function () { hideToast(); onUndo(); }
            }));
        }
        children.push(el('button', {
            type: 'button', class: 'mst-toast-close', 'aria-label': 'Dismiss', text: '×',
            onclick: hideToast
        }));
        fill(box, children);
        box.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(hideToast, onUndo ? 8000 : 4000);
    }

    function hideToast() {
        const box = byId('mst-toast');
        if (box) box.classList.remove('show');
    }

    // ---------- Dashboard (home.html) ----------
    function renderHome() {
        if (!byId('home-balance')) return;
        const state = M.load();
        const t = M.totals();

        setText('home-balance', rp(t.balance));
        setText('home-income', rp(t.income));
        setText('home-saved', rp(t.saved));
        setText('home-expense', rp(t.expense));

        // Expenses in the chosen period (counted back from the most recent month with records)
        const periodSelect = byId('home-period');
        bindOnce(periodSelect, 'change', renderHome);
        const period = periodSelect ? periodSelect.value : 'all';
        let expenses = state.expenses;
        let span;
        if (period === 'all') {
            const months = expenses.map(function (e) { return M.monthKey(e.date); }).sort();
            span = months.length ? monthsBetween(months[0], months[months.length - 1]) : 1;
        } else {
            const keys = monthsBack(M.latestMonth(), Number(period));
            expenses = expenses.filter(function (e) { return keys.indexOf(M.monthKey(e.date)) > -1; });
            span = keys.length;
        }
        const periodTotal = M.sum(expenses);

        // Average spend per day / week / month over that period
        const monthly = periodTotal / span;
        setText('home-avg-monthly', rp(monthly));
        setText('home-avg-weekly', rp(monthly * 12 / 52));
        setText('home-avg-daily', rp(monthly * 12 / 365));

        // Expenses by category
        const slices = M.byCategory(expenses);
        const donut = byId('home-donut');
        donut.style.background = donutGradient(slices, periodTotal);
        donut.setAttribute('aria-label', slices.length
            ? 'Expenses by category: ' + slices.map(function (s) { return s.label + ' ' + percentOf(s.amount, periodTotal) + '%'; }).join(', ')
            : 'No expenses in this period');
        fill(donut, [el('span', { class: 'mst-home-donut-total', 'aria-hidden': 'true' }, [
            el('span', { class: 'mst-home-donut-label', text: 'Total' }),
            el('span', { text: compactRupiah(periodTotal) })
        ])]);

        fill(byId('home-legend'), slices.length ? slices.map(function (s) {
            return el('li', { class: 'legend-item' }, [
                el('span', { class: 'legend-color', style: 'background: ' + s.color }),
                el('span', { class: 'mst-legend-label', text: s.label }),
                el('span', { class: 'mst-legend-value', text: percentOf(s.amount, periodTotal) + '%' })
            ]);
        }) : [el('li', { class: 'legend-item', text: 'No expenses in this period' })]);

        // Savings goals
        const list = byId('home-goals');
        fill(list, state.goals.length ? state.goals.slice(0, 4).map(function (goal) {
            const p = M.goalProgress(goal);
            return el('div', { class: 'savings-item' }, [
                el('div', { class: 'savings-info' }, [
                    el('h4', { class: 'mst-wrap', text: goal.name }),
                    progressBar('savings-progress', 'progress-bar', p.percent, goal.name + ': ' + p.percent + '% saved')
                ]),
                el('div', { class: 'savings-amount mst-goal-amount' }, [
                    el('span', { text: rp(p.saved) }),
                    el('span', { class: 'mst-of', text: 'of ' + rp(p.target) })
                ])
            ]);
        }) : [emptyState('No saving goals yet.', { href: 'addSavings.html', label: 'Create a goal' })]);
    }

    // ---------- Transaction (transaction.html) ----------
    function weeklyBuckets(monthKeyValue) {
        const parts = monthKeyValue.split('-').map(Number);
        const lastDay = new Date(parts[0], parts[1], 0).getDate();
        const ranges = [[1, 7], [8, 14], [15, 21], [22, 28], [29, lastDay]];
        const state = M.load();
        const income = M.inMonth(state.income, monthKeyValue);
        const expenses = M.inMonth(state.expenses, monthKeyValue);
        function inRange(list, r) {
            return M.sum(list.filter(function (x) {
                const day = M.parseDate(x.date).getDate();
                return day >= r[0] && day <= r[1];
            }));
        }
        return ranges.map(function (r) {
            return { label: r[0] + '–' + r[1], income: inRange(income, r), expense: inRange(expenses, r) };
        });
    }

    function renderTransaction() {
        if (!byId('tx-balance')) return;
        const state = M.load();
        const t = M.totals();

        setText('tx-balance', rp(t.balance));
        setText('tx-status', t.balance >= 0 ? 'Good! Keep it up!' : 'Careful! You are overspending');

        const catInput = byId('tx-category-month');
        const flowInput = byId('tx-flow-month');
        if (!catInput.dataset.ready) {
            const latest = M.latestMonth();
            catInput.value = latest;
            flowInput.value = latest;
            catInput.dataset.ready = flowInput.dataset.ready = '1';
            catInput.addEventListener('change', renderTransaction);
            flowInput.addEventListener('change', renderTransaction);
        }

        // Expense categories for the chosen month
        const catMonth = catInput.value || M.latestMonth();
        const monthExpenses = M.inMonth(state.expenses, catMonth);
        const slices = M.byCategory(monthExpenses);
        const catTotal = M.sum(monthExpenses);
        const donutBox = byId('tx-donut');
        if (!slices.length) {
            fill(donutBox, [emptyState('No expenses in ' + M.formatMonth(catMonth) + '.', { href: 'addExpense.html', label: 'Add an expense' })]);
        } else {
            fill(donutBox, [
                el('div', {
                    class: 'mst-donut', role: 'img',
                    'aria-label': 'Expenses in ' + M.formatMonth(catMonth) + ': ' + slices.map(function (s) {
                        return s.label + ' ' + percentOf(s.amount, catTotal) + '%';
                    }).join(', '),
                    style: 'background: ' + donutGradient(slices, catTotal)
                }, [
                    el('div', { class: 'mst-donut-center' }, [
                        el('span', { class: 'mst-donut-label', text: 'Total' }),
                        el('span', { class: 'mst-donut-total', text: rp(catTotal) })
                    ])
                ]),
                el('ul', { class: 'mst-cat-legend' }, slices.map(function (s) {
                    return el('li', {}, [
                        el('span', { class: 'mst-cat-dot', style: 'background: ' + s.color }),
                        el('span', { class: 'mst-cat-name', text: s.icon + ' ' + s.label }),
                        el('span', { class: 'mst-cat-pct', text: percentOf(s.amount, catTotal) + '%' }),
                        el('span', { class: 'mst-cat-amt', text: rp(s.amount) })
                    ]);
                }))
            ]);
        }

        // Income vs expenses per week for the chosen month
        const flowMonth = flowInput.value || M.latestMonth();
        const buckets = weeklyBuckets(flowMonth);
        const monthIncome = M.sum(M.inMonth(state.income, flowMonth));
        const monthExpense = M.sum(M.inMonth(state.expenses, flowMonth));
        setText('tx-income', rp(monthIncome));
        setText('tx-expense', rp(monthExpense));

        const barsBox = byId('tx-bars');
        if (!monthIncome && !monthExpense) {
            fill(barsBox, [emptyState('No income or expenses in ' + M.formatMonth(flowMonth) + '.')]);
            return;
        }
        const max = Math.max.apply(null, buckets.map(function (b) { return Math.max(b.income, b.expense); }));
        fill(barsBox, [
            el('div', { class: 'mst-bars' }, buckets.map(function (b) {
                const label = shortMonth(flowMonth) + ' ' + b.label;
                return el('div', {
                    class: 'mst-bar-group', role: 'img',
                    'aria-label': label + ': income ' + rp(b.income) + ', expenses ' + rp(b.expense)
                }, [
                    el('div', { class: 'mst-bar-pair' }, [
                        el('div', { class: 'mst-bar income', style: 'height: ' + percentOf(b.income, max) + '%', title: 'Income ' + rp(b.income) }),
                        el('div', { class: 'mst-bar expense', style: 'height: ' + percentOf(b.expense, max) + '%', title: 'Expenses ' + rp(b.expense) })
                    ]),
                    el('span', { class: 'mst-bar-label', text: b.label })
                ]);
            })),
            el('p', { class: 'mst-bars-scale', text: 'Tallest bar = ' + rp(max) })
        ]);
    }

    // ---------- Finance record (financeRecord.html) ----------
    const highlightId = new URLSearchParams(window.location.search).get('new');

    function financeRow(type, record) {
        const isIncome = type === 'income';
        const meta = isIncome ? { icon: '💰', label: M.incomeLabel(record) } : M.categoryMeta(record.category);
        const name = meta.label;
        return el('div', { class: 'finance-item' + (record.id === highlightId ? ' is-new' : ''), 'data-id': record.id }, [
            el('div', { class: 'item-icon', 'aria-hidden': 'true', text: meta.icon }),
            el('div', { class: 'item-details' }, [
                el('div', { class: 'item-name mst-wrap', text: name }),
                el('div', { class: 'item-amount', text: rp(record.amount) })
            ]),
            el('div', { class: 'item-date', text: M.formatDate(record.date) }),
            el('button', {
                type: 'button', class: 'delete-btn', text: '−',
                'aria-label': 'Delete ' + name + ' ' + (isIncome ? 'income' : 'expense') + ' of ' + rp(record.amount),
                title: 'Delete',
                onclick: function () { deleteRecord(type, record, name, this.closest('.finance-item')); }
            })
        ]);
    }

    function deleteRecord(type, record, name, row) {
        const finish = function () {
            const removed = M.remove(type, record.id);
            render();
            toast(name + ' ' + (type === 'income' ? 'income' : 'expense') + ' of ' + rp(record.amount) + ' deleted.', function () {
                M.restore(removed);
                render();
                toast('Restored.');
            });
        };
        if (row && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            row.classList.add('is-leaving');
            setTimeout(finish, 250);
        } else {
            finish();
        }
    }

    // Monthly / Weekly / Daily: the month, 7 days or day of the most recent record
    // (or of the record just added, on arrival)
    function periodFilter(kind, list) {
        const name = kind + '-period';
        document.querySelectorAll('input[name="' + name + '"]').forEach(function (radio) {
            bindOnce(radio, 'change', function () { ui.anchorUsed[kind] = true; renderFinanceRecord(); });
        });
        const checked = document.querySelector('input[name="' + name + '"]:checked');
        const period = checked ? checked.value : 'monthly';
        if (!list.length) return { items: [], caption: '' };

        let anchor = list[0].date;
        const fresh = highlightId && !ui.anchorUsed[kind] && list.find(function (r) { return r.id === highlightId; });
        if (fresh) anchor = fresh.date;

        let items, caption;
        if (period === 'daily') {
            items = list.filter(function (r) { return r.date === anchor; });
            caption = M.formatDate(anchor);
        } else if (period === 'weekly') {
            const from = addDays(anchor, -6);
            items = list.filter(function (r) { return r.date >= from && r.date <= anchor; });
            caption = M.formatShortDate(from) + ' – ' + M.formatShortDate(anchor) + ', ' + anchor.slice(0, 4);
        } else {
            items = M.inMonth(list, M.monthKey(anchor));
            caption = M.formatMonth(M.monthKey(anchor));
        }
        return { items: items, caption: 'Showing ' + caption };
    }

    function periodCaption(card, text) {
        let caption = card.querySelector('.mst-period-caption');
        if (!caption) {
            caption = el('p', { class: 'mst-period-caption', 'aria-live': 'polite' });
            card.querySelector('.period-toggle').after(caption);
        }
        caption.textContent = text;
    }

    function renderFinanceRecord() {
        if (!byId('income-items')) return;
        const state = M.load();
        const income = periodFilter('income', M.newestFirst(state.income));
        const expenses = periodFilter('expense', M.newestFirst(state.expenses));

        periodCaption(document.querySelector('.income-card'), income.caption);
        periodCaption(document.querySelector('.expense-card'), expenses.caption);

        fill(byId('income-items'), income.items.length
            ? income.items.map(function (r) { return financeRow('income', r); })
            : [emptyState('No income recorded yet.', { href: 'addIncome.html', label: 'Add income' })]);
        fill(byId('expense-items'), expenses.items.length
            ? expenses.items.map(function (r) { return financeRow('expense', r); })
            : [emptyState('No expenses recorded yet.', { href: 'addExpense.html', label: 'Add an expense' })]);

        setText('income-total', rp(M.sum(income.items)));
        setText('expense-total', rp(M.sum(expenses.items)));
    }

    // ---------- Savings (savings.html) ----------
    const DOT_CLASSES = ['tosca', 'blue', 'purple', 'orange', 'yellow'];

    function renderSavings() {
        if (!byId('sv-total')) return;
        const state = M.load();
        const t = M.totals();
        const contributions = M.newestFirst(state.contributions);

        setText('sv-total', rp(t.saved));
        if (contributions.length) {
            const lastMonth = M.monthKey(contributions[0].date);
            setText('sv-month', '+' + rp(M.sum(M.inMonth(state.contributions, lastMonth))) + ' in ' + M.formatMonth(lastMonth));
        } else {
            setText('sv-month', 'Nothing saved yet');
        }

        // Goal list
        fill(byId('sv-goals'), state.goals.length ? state.goals.slice(0, 4).map(function (goal) {
            const p = M.goalProgress(goal);
            return el('div', { class: 'saving-item' }, [
                el('div', { class: 'saving-info' }, [
                    el('span', { class: 'saving-name mst-wrap', text: goal.name }),
                    progressBar('progress-bar', 'progress-fill', p.percent, goal.name + ': ' + p.percent + '% saved')
                ]),
                el('span', { class: 'saving-amount mst-goal-amount' }, [
                    el('span', { text: rp(p.saved) }),
                    el('span', { class: 'mst-of', text: 'of ' + rp(p.target) })
                ])
            ]);
        }) : [emptyState('No saving goals yet.', { href: 'addSavings.html', label: 'Create a goal' })]);

        // Monthly progress: money saved per month (latest 6 months with savings)
        const monthKeys = Array.from(new Set(state.contributions.map(function (c) { return M.monthKey(c.date); }))).sort().slice(-6);
        const monthlyBox = byId('sv-monthly');
        if (!monthKeys.length) {
            fill(monthlyBox, [emptyState('Your monthly savings will appear here.')]);
        } else {
            const perMonth = monthKeys.map(function (k) { return { key: k, amount: M.sum(M.inMonth(state.contributions, k)) }; });
            const max = Math.max.apply(null, perMonth.map(function (m) { return m.amount; }));
            fill(monthlyBox, [el('div', { class: 'mst-columns' }, perMonth.map(function (m) {
                return el('div', { class: 'mst-column', role: 'img', 'aria-label': M.formatMonth(m.key) + ': saved ' + rp(m.amount) }, [
                    el('span', { class: 'mst-column-value', text: compactRupiah(m.amount) }),
                    el('div', { class: 'mst-column-track' }, [
                        el('div', { class: 'mst-column-fill', style: 'height: ' + percentOf(m.amount, max) + '%' })
                    ]),
                    el('span', { class: 'mst-column-label', text: shortMonth(m.key) })
                ]);
            }))]);
        }

        // Recent savings
        const goalName = function (id) {
            const goal = state.goals.find(function (g) { return g.id === id; });
            return goal ? goal.name : 'Savings';
        };
        fill(byId('sv-recent'), contributions.length ? contributions.slice(0, 5).map(function (c, i) {
            return el('div', { class: 'recent-item' }, [
                el('div', { class: 'recent-dot ' + DOT_CLASSES[i % DOT_CLASSES.length] }),
                el('span', { class: 'recent-text mst-wrap', text: M.formatShortDate(c.date) + ' · ' + goalName(c.goalId) }),
                el('span', { class: 'recent-amount', text: rp(c.amount) })
            ]);
        }) : [emptyState('No savings yet.')]);

        // Saving analysis
        let completeCount = 0, completeSaved = 0, ongoingSaved = 0, totalTarget = 0;
        state.goals.forEach(function (goal) {
            const p = M.goalProgress(goal);
            totalTarget += goal.target;
            if (p.complete) { completeCount += 1; completeSaved += p.saved; } else { ongoingSaved += p.saved; }
        });
        setText('sv-history', completeCount + ' / ' + state.goals.length + ' goals completed');
        fill(byId('sv-history-bars'), state.goals.slice(0, 5).map(function (goal) {
            const p = M.goalProgress(goal);
            return el('span', { class: 'mst-mini-bar' + (p.complete ? ' is-complete' : '') }, [
                el('span', { style: 'height: ' + Math.max(p.percent, 6) + '%' })
            ]);
        }));

        renderSavingsCalendar(state, contributions);
        setText('sv-complete', rp(completeSaved));
        setText('sv-ongoing', rp(ongoingSaved));

        // Overall progress ring: everything saved vs every target
        const overall = totalTarget ? Math.min(100, Math.round((t.saved / totalTarget) * 100)) : 0;
        const r = 54, circumference = 2 * Math.PI * r;
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        ring.setAttribute('viewBox', '0 0 140 140');
        ring.setAttribute('class', 'mst-ring');
        ring.setAttribute('role', 'img');
        ring.setAttribute('aria-label', 'Overall: ' + overall + '% of all saving targets reached');
        ring.innerHTML =
            '<circle cx="70" cy="70" r="' + r + '" class="mst-ring-track"/>' +
            '<circle cx="70" cy="70" r="' + r + '" class="mst-ring-fill" stroke-dasharray="' + circumference.toFixed(1) +
            '" stroke-dashoffset="' + (circumference * (1 - overall / 100)).toFixed(1) + '" transform="rotate(-90 70 70)"/>' +
            '<text x="70" y="68" class="mst-ring-value">' + overall + '%</text>' +
            '<text x="70" y="88" class="mst-ring-caption">of all targets</text>';
        fill(byId('sv-ring'), [ring]);

        // Analytics: saved vs spent per month for the most recent year with data
        const years = Array.from(new Set(state.contributions.concat(state.expenses).map(function (x) { return x.date.slice(0, 4); }))).sort().reverse();
        if (!years.length) years.push(M.todayISO().slice(0, 4));
        if (!ui.year || years.indexOf(ui.year) < 0) ui.year = years[0];
        const year = ui.year;
        const yearSelect = byId('sv-year');
        fill(yearSelect, years.map(function (y) { return el('option', { value: y, text: y }); }));
        yearSelect.value = year;
        bindOnce(yearSelect, 'change', function () { ui.year = yearSelect.value; renderSavings(); });
        const inYear = function (list) { return list.filter(function (x) { return x.date.slice(0, 4) === year; }); };
        const yearMonths = inYear(state.contributions).concat(inYear(state.expenses)).map(function (x) { return Number(x.date.slice(5, 7)); });
        const lastMonthNum = Math.max(6, yearMonths.length ? Math.max.apply(null, yearMonths) : 0);
        const rows = [];
        for (let m = 1; m <= lastMonthNum; m++) {
            const key = year + '-' + String(m).padStart(2, '0');
            rows.push({ key: key, saved: M.sum(M.inMonth(state.contributions, key)), spent: M.sum(M.inMonth(state.expenses, key)) });
        }
        const maxRow = Math.max(1, Math.max.apply(null, rows.map(function (x) { return Math.max(x.saved, x.spent); })));
        fill(byId('sv-analytics'), [
            el('div', { class: 'mst-bars mst-bars-tall' }, rows.map(function (x) {
                return el('div', {
                    class: 'mst-bar-group', role: 'img',
                    'aria-label': M.formatMonth(x.key) + ': saved ' + rp(x.saved) + ', spent ' + rp(x.spent)
                }, [
                    el('div', { class: 'mst-bar-pair' }, [
                        el('div', { class: 'mst-bar saved', style: 'height: ' + percentOf(x.saved, maxRow) + '%', title: 'Saved ' + rp(x.saved) }),
                        el('div', { class: 'mst-bar spent', style: 'height: ' + percentOf(x.spent, maxRow) + '%', title: 'Spent ' + rp(x.spent) })
                    ]),
                    el('span', { class: 'mst-bar-label', text: shortMonth(x.key) })
                ]);
            })),
            el('p', { class: 'mst-bars-scale', text: 'Tallest bar = ' + rp(maxRow) })
        ]);
    }

    // Month calendar marking the days money went into a goal
    function renderSavingsCalendar(state, contributions) {
        const grid = byId('sv-calendar');
        if (!grid) return;
        if (!ui.calMonth) ui.calMonth = contributions.length ? M.monthKey(contributions[0].date) : M.todayISO().slice(0, 7);
        const key = ui.calMonth;
        setText('sv-cal-title', M.formatMonth(key));

        bindOnce(byId('sv-cal-prev'), 'click', function () { ui.calMonth = monthsBack(ui.calMonth, 2)[0]; renderSavings(); });
        bindOnce(byId('sv-cal-next'), 'click', function () {
            const p = ui.calMonth.split('-').map(Number);
            const d = new Date(p[0], p[1], 1);
            ui.calMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            renderSavings();
        });

        const parts = key.split('-').map(Number);
        const daysInMonth = new Date(parts[0], parts[1], 0).getDate();
        const leading = (new Date(parts[0], parts[1] - 1, 1).getDay() + 6) % 7; // Monday first
        const today = M.todayISO();
        const goalName = function (id) {
            const goal = state.goals.find(function (g) { return g.id === id; });
            return goal ? goal.name : 'Savings';
        };
        const byDay = {};
        M.inMonth(state.contributions, key).forEach(function (c) {
            (byDay[c.date] = byDay[c.date] || []).push(c);
        });
        const savedDays = Object.keys(byDay).length;
        const monthTotal = M.sum(M.inMonth(state.contributions, key));

        const cells = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (d) {
            return el('span', { class: 'mst-cal-weekday', title: d, 'aria-hidden': 'true', text: d.charAt(0) });
        });
        for (let i = 0; i < leading; i++) cells.push(el('span', { class: 'mst-cal-blank', 'aria-hidden': 'true' }));
        for (let day = 1; day <= daysInMonth; day++) {
            const iso = key + '-' + String(day).padStart(2, '0');
            const saved = byDay[iso];
            const detail = saved
                ? 'saved ' + rp(M.sum(saved)) + ' (' + saved.map(function (c) { return goalName(c.goalId); }).join(', ') + ')'
                : '';
            cells.push(el('span', {
                class: 'mst-cal-day' + (saved ? ' has-saving' : '') + (iso === today ? ' is-today' : ''),
                title: detail || null,
                'aria-label': M.formatDate(iso) + (detail ? ': ' + detail : '')
            }, [el('span', { 'aria-hidden': 'true', text: String(day) })]));
        }
        fill(grid, [
            el('div', { class: 'mst-calendar', role: 'group', 'aria-label': 'Savings in ' + M.formatMonth(key) }, cells),
            el('p', {
                class: 'mst-cal-summary',
                text: monthTotal ? rp(monthTotal) + ' saved on ' + savedDays + ' day' + (savedDays === 1 ? '' : 's') : 'Nothing saved this month'
            })
        ]);
    }

    // ---------- Goal cards (viewSavings.html, addSavings.html) ----------
    function goalPeriod(goal) {
        const fmt = function (iso) { return M.parseDate(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
        if (goal.startDate && goal.targetDate) return fmt(goal.startDate) + ' – ' + fmt(goal.targetDate);
        return goal.targetDate ? 'Until ' + fmt(goal.targetDate) : 'No end date';
    }

    function goalProgressBlock(goal, p) {
        return [
            progressBar('mst-goalbar', 'mst-goalbar-fill', p.percent, goal.name + ': ' + p.percent + '% saved'),
            el('div', { class: 'mst-goal-text', text: p.complete ? 'Target reached! 🎉' : 'You reached ' + p.percent + '% of your savings target' }),
            el('div', { class: 'mst-range' }, [
                el('span', { text: rp(p.saved) + ' saved' }),
                el('span', { text: rp(p.target) + ' target' })
            ])
        ];
    }

    function deleteGoal(goal) {
        const removed = M.remove('goal', goal.id);
        render();
        toast('Saving goal "' + goal.name + '" deleted.', function () {
            M.restore(removed);
            render();
            toast('Restored.');
        });
    }

    function renderViewSavings() {
        const list = byId('vs-list');
        if (!list) return;
        const goals = M.load().goals;
        fill(list, goals.length ? goals.map(function (goal) {
            const p = M.goalProgress(goal);
            return el('div', { class: 'savings-card-viewsave' + (goal.id === highlightId ? ' is-new' : ''), id: goal.id, 'data-id': goal.id }, [
                el('div', { class: 'savings-left-viewsave' }, [
                    el('h3', { class: 'savings-title-viewsave mst-wrap', text: goal.name }),
                    el('div', { class: 'progress-container-viewsave' }, goalProgressBlock(goal, p)),
                    el('div', { class: 'button-container-viewsave' }, [
                        el('a', {
                            href: 'addSavings.html?edit=' + encodeURIComponent(goal.id), class: 'edit-btn-viewsave',
                            'aria-label': 'Edit saving goal ' + goal.name, text: 'Edit Savings'
                        }),
                        el('button', {
                            type: 'button', class: 'delete-btn-viewsave', text: 'Delete Savings',
                            'aria-label': 'Delete saving goal ' + goal.name,
                            onclick: function () { deleteGoal(goal); }
                        })
                    ])
                ]),
                el('div', { class: 'savings-right-viewsave' }, [
                    el('div', { class: 'info-section-viewsave' }, [
                        el('h4', { class: 'info-title-viewsave', text: 'Saving Description' }),
                        el('div', { class: 'info-content-viewsave mst-wrap', text: goal.description ? '"' + goal.description + '"' : 'No description' }),
                        el('div', { class: 'period-info-viewsave' }, [
                            el('h5', { class: 'period-title-viewsave', text: 'Saving Period' }),
                            el('div', { class: 'period-content-viewsave' }, [
                                el('span', { class: 'calendar-icon-viewsave', 'aria-hidden': 'true', text: '🗓️' }),
                                ' ' + goalPeriod(goal)
                            ])
                        ])
                    ])
                ])
            ]);
        }) : [emptyState('You have no saving goals yet.', { href: 'addSavings.html', label: 'Create your first goal' })]);
    }

    function renderAddSavingsList() {
        const list = byId('as-list');
        if (!list) return;
        const goals = M.load().goals;
        fill(list, goals.length ? goals.map(function (goal) {
            const p = M.goalProgress(goal);
            return el('div', { class: 'savings-card-addSave' }, [
                el('h3', { class: 'mst-wrap', text: goal.name }),
                el('div', { class: 'progress-container-addSave' }, goalProgressBlock(goal, p)),
                el('a', { href: 'viewSavings.html#' + goal.id, class: 'view-details-btn', text: 'View Details' })
            ]);
        }) : [emptyState('Your other saving goals will appear here.')]);
    }

    // ---------- Boot ----------
    function render() {
        renderHome();
        renderTransaction();
        renderFinanceRecord();
        renderSavings();
        renderViewSavings();
        renderAddSavingsList();
    }

    function revealHighlight() {
        if (!highlightId) return;
        const target = document.querySelector('[data-id="' + CSS.escape(highlightId) + '"]');
        if (target) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function showFlash() {
        const flash = M.takeFlash();
        if (!flash) return;
        const undo = flash.undo;
        toast(flash.message, undo ? function () {
            if (undo.restore) M.update(undo.type, undo.id, undo.restore);
            else M.remove(undo.type, undo.id);
            render();
            toast('Undone.');
        } : null);
    }

    function boot() {
        render();
        revealHighlight();
        showFlash();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.MoneystPages = { render: render, toast: toast };
})();
