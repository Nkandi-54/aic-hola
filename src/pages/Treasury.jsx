import React, { useCallback, useEffect, useMemo, useState } from "react";
import ConsoleLayout from "../components/ConsoleLayout";
import { supabase } from "../lib/supabase";
import { formatMoney } from "../lib/auth";

const today = () => new Date().toISOString().slice(0, 10);

const emptyFund = {
  id: "",
  name: "",
  kind: "general",
  description: "",
  is_active: true,
};
const emptyTxn = {
  id: "",
  fund_id: "",
  direction: "income",
  category: "offering",
  amount: "",
  currency: "KES",
  occurred_on: today(),
  reference: "",
  description: "",
};
const emptyBudget = {
  id: "",
  fund_id: "",
  period_label: "",
  period_start: today(),
  period_end: today(),
  planned_income: "",
  planned_expense: "",
  notes: "",
};
const emptyPledge = {
  id: "",
  member_id: "",
  fund_id: "",
  purpose: "",
  amount_pledged: "",
  amount_received: "",
  currency: "KES",
  pledged_on: today(),
  due_on: "",
  status: "active",
  notes: "",
};
const emptyApproval = {
  id: "",
  title: "",
  fund_id: "",
  amount: "",
  currency: "KES",
  category: "general",
  payee: "",
  justification: "",
  needed_by: "",
  status: "pending",
};
const emptyAccount = {
  id: "",
  name: "",
  bank_name: "",
  account_number: "",
  currency: "KES",
  statement_balance: "",
};
const emptyMember = {
  id: "",
  full_name: "",
  phone: "",
  email: "",
  member_number: "",
};

const FUND_KINDS = [
  "general",
  "building",
  "missions",
  "welfare",
  "youth",
  "other",
];

export default function Treasury() {
  const [funds, setFunds] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("overview");
  const [fundForm, setFundForm] = useState(emptyFund);
  const [txnForm, setTxnForm] = useState(emptyTxn);
  const [budgetForm, setBudgetForm] = useState(emptyBudget);
  const [pledgeForm, setPledgeForm] = useState(emptyPledge);
  const [approvalForm, setApprovalForm] = useState(emptyApproval);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [reconAccountId, setReconAccountId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [
      fundResult,
      txnResult,
      budgetResult,
      pledgeResult,
      approvalResult,
      accountResult,
      memberResult,
    ] = await Promise.all([
      supabase
        .from("funds")
        .select("id,name,kind,description,is_active")
        .order("name"),
      supabase
        .from("transactions")
        .select(
          "id,fund_id,direction,category,amount,currency,occurred_on,reference,description,bank_account_id,is_reconciled",
        )
        .order("occurred_on", { ascending: false })
        .limit(1000),
      supabase
        .from("budgets")
        .select(
          "id,fund_id,period_label,period_start,period_end,planned_income,planned_expense,notes",
        )
        .order("period_start", { ascending: false }),
      supabase
        .from("pledges")
        .select(
          "id,member_id,fund_id,purpose,amount_pledged,amount_received,currency,pledged_on,due_on,status,notes",
        )
        .order("pledged_on", { ascending: false }),
      supabase
        .from("expenditure_requests")
        .select(
          "id,title,fund_id,amount,currency,category,payee,justification,needed_by,status,decision_note,created_at,decided_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("bank_accounts")
        .select(
          "id,name,bank_name,account_number,currency,statement_balance,reconciled_through,is_active",
        )
        .order("name"),
      supabase
        .from("finance_members")
        .select("id,full_name,phone,email,member_number")
        .order("full_name"),
    ]);
    setFunds(fundResult.data || []);
    setTransactions(txnResult.data || []);
    setBudgets(budgetResult.data || []);
    setPledges(pledgeResult.data || []);
    setApprovals(approvalResult.data || []);
    setAccounts(accountResult.data || []);
    setMembers(memberResult.data || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.direction === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.direction === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const perFund = useMemo(
    () =>
      funds.map((fund) => {
        const rows = transactions.filter((t) => t.fund_id === fund.id);
        const income = rows
          .filter((t) => t.direction === "income")
          .reduce((s, t) => s + Number(t.amount), 0);
        const expense = rows
          .filter((t) => t.direction === "expense")
          .reduce((s, t) => s + Number(t.amount), 0);
        return { ...fund, income, expense, balance: income - expense };
      }),
    [funds, transactions],
  );

  const saveFund = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const payload = {
      name: fundForm.name,
      kind: fundForm.kind,
      description: fundForm.description,
      is_active: fundForm.is_active,
    };
    const result = fundForm.id
      ? await supabase.from("funds").update(payload).eq("id", fundForm.id)
      : await supabase.from("funds").insert(payload);
    setStatus(
      result.error
        ? `Could not save fund: ${result.error.message}`
        : "Fund saved.",
    );
    if (!result.error) {
      setFundForm(emptyFund);
      await load();
    }
    setBusy(false);
  };

  const saveTxn = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const payload = {
      fund_id: txnForm.fund_id,
      direction: txnForm.direction,
      category: txnForm.category,
      amount: Number(txnForm.amount),
      currency: txnForm.currency,
      occurred_on: txnForm.occurred_on,
      reference: txnForm.reference,
      description: txnForm.description,
    };
    const result = txnForm.id
      ? await supabase.from("transactions").update(payload).eq("id", txnForm.id)
      : await supabase.from("transactions").insert(payload);
    setStatus(
      result.error
        ? `Could not save entry: ${result.error.message}`
        : "Entry recorded.",
    );
    if (!result.error) {
      setTxnForm(emptyTxn);
      await load();
    }
    setBusy(false);
  };

  const saveBudget = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const payload = {
      fund_id: budgetForm.fund_id,
      period_label: budgetForm.period_label,
      period_start: budgetForm.period_start,
      period_end: budgetForm.period_end,
      planned_income: Number(budgetForm.planned_income) || 0,
      planned_expense: Number(budgetForm.planned_expense) || 0,
      notes: budgetForm.notes,
    };
    const result = budgetForm.id
      ? await supabase.from("budgets").update(payload).eq("id", budgetForm.id)
      : await supabase.from("budgets").insert(payload);
    setStatus(
      result.error
        ? `Could not save budget: ${result.error.message}`
        : "Budget saved.",
    );
    if (!result.error) {
      setBudgetForm(emptyBudget);
      await load();
    }
    setBusy(false);
  };

  const removeRow = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    setStatus(error ? `Could not delete: ${error.message}` : "Deleted.");
    await load();
  };

  const savePledge = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const payload = {
      member_id: pledgeForm.member_id || null,
      fund_id: pledgeForm.fund_id || null,
      purpose: pledgeForm.purpose,
      amount_pledged: Number(pledgeForm.amount_pledged),
      amount_received: Number(pledgeForm.amount_received) || 0,
      currency: pledgeForm.currency,
      pledged_on: pledgeForm.pledged_on,
      due_on: pledgeForm.due_on || null,
      status: pledgeForm.status,
      notes: pledgeForm.notes,
    };
    const result = pledgeForm.id
      ? await supabase.from("pledges").update(payload).eq("id", pledgeForm.id)
      : await supabase.from("pledges").insert(payload);
    setStatus(
      result.error
        ? `Could not save pledge: ${result.error.message}`
        : "Pledge saved.",
    );
    if (!result.error) {
      setPledgeForm(emptyPledge);
      await load();
    }
    setBusy(false);
  };

  const saveApproval = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const payload = {
      title: approvalForm.title,
      fund_id: approvalForm.fund_id,
      amount: Number(approvalForm.amount),
      currency: approvalForm.currency,
      category: approvalForm.category,
      payee: approvalForm.payee,
      justification: approvalForm.justification,
      needed_by: approvalForm.needed_by || null,
      status: approvalForm.status,
    };
    const result = approvalForm.id
      ? await supabase
          .from("expenditure_requests")
          .update(payload)
          .eq("id", approvalForm.id)
      : await supabase.from("expenditure_requests").insert(payload);
    setStatus(
      result.error
        ? `Could not save request: ${result.error.message}`
        : "Expenditure request saved.",
    );
    if (!result.error) {
      setApprovalForm(emptyApproval);
      await load();
    }
    setBusy(false);
  };

  // A treasurer marks a request approved / rejected / paid. The database stamps
  // who decided and when, and refuses the change from anyone else.
  const decideApproval = async (row, next) => {
    setStatus("");
    const { error } = await supabase
      .from("expenditure_requests")
      .update({ status: next, decision_note: row.decision_note || "" })
      .eq("id", row.id);
    setStatus(
      error ? `Could not update: ${error.message}` : `Request ${next}.`,
    );
    await load();
  };

  // Settle an approved request: create the real expense transaction and link it.
  const payApproval = async (row) => {
    setBusy(true);
    setStatus("");
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        fund_id: row.fund_id,
        direction: "expense",
        category: row.category,
        amount: Number(row.amount),
        currency: row.currency,
        occurred_on: today(),
        reference: row.payee,
        description: row.title,
      })
      .select("id")
      .single();
    if (error) {
      setStatus(`Could not record payment: ${error.message}`);
      setBusy(false);
      return;
    }
    await supabase
      .from("expenditure_requests")
      .update({ status: "paid", transaction_id: data.id })
      .eq("id", row.id);
    setStatus("Payment recorded and linked to the ledger.");
    await load();
    setBusy(false);
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const payload = {
      name: accountForm.name,
      bank_name: accountForm.bank_name,
      account_number: accountForm.account_number,
      currency: accountForm.currency,
      statement_balance: Number(accountForm.statement_balance) || 0,
    };
    const result = accountForm.id
      ? await supabase.from("bank_accounts").update(payload).eq("id", accountForm.id)
      : await supabase.from("bank_accounts").insert(payload);
    setStatus(
      result.error
        ? `Could not save account: ${result.error.message}`
        : "Bank account saved.",
    );
    if (!result.error) {
      setAccountForm(emptyAccount);
      await load();
    }
    setBusy(false);
  };

  const saveMember = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const payload = { ...memberForm };
    delete payload.id;
    const result = memberForm.id
      ? await supabase.from("finance_members").update(payload).eq("id", memberForm.id)
      : await supabase.from("finance_members").insert(payload);
    setStatus(
      result.error
        ? `Could not save member: ${result.error.message}`
        : "Member saved.",
    );
    if (!result.error) {
      setMemberForm(emptyMember);
      await load();
    }
    setBusy(false);
  };

  // Toggle whether a transaction has cleared the bank — the heart of a
  // reconciliation.
  const toggleReconciled = async (row) => {
    setStatus("");
    const { error } = await supabase
      .from("transactions")
      .update({
        is_reconciled: !row.is_reconciled,
        reconciled_at: !row.is_reconciled ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    setStatus(error ? `Could not update: ${error.message}` : "Reconciliation updated.");
    await load();
  };

  const markReconciledThrough = async (account) => {
    setStatus("");
    const { error } = await supabase
      .from("bank_accounts")
      .update({ reconciled_through: today() })
      .eq("id", account.id);
    setStatus(
      error
        ? `Could not update: ${error.message}`
        : `Books reconciled through ${today()}.`,
    );
    await load();
  };

  // Download the current ledger as CSV — accountants live in spreadsheets.
  const exportCsv = (rows, filename, columns) => {
    const header = columns.map((c) => c.label).join(",");
    const body = rows
      .map((row) =>
        columns
          .map((c) => {
            const value = c.value(row);
            const text = value === null || value === undefined ? "" : String(value);
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const memberName = (id) =>
    members.find((m) => m.id === id)?.full_name || "—";

  const fundName = (id) => funds.find((f) => f.id === id)?.name || "—";

  return (
    <ConsoleLayout
      title="Treasury"
      intro="Record giving and expenditure, plan budgets, and keep transparent books per fund. Everything here is audit-logged."
      allow={(_profile, auth) => auth.isTreasurer}
      denyMessage="The treasury workspace is reserved for treasurers, administrators and the pastor."
    >
      <div className="row wrap">
        {[
          ["overview", "Overview"],
          ["give", "Income & expenses"],
          ["funds", "Funds"],
          ["budgets", "Budgets"],
          ["pledges", "Pledges"],
          ["approvals", "Approvals"],
          ["reconcile", "Reconciliation"],
          ["reports", "Reports"],
          ["people", "Givers"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`button ${tab === key ? "" : "ghost"}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {status ? (
        <p className="badge subtle" role="status">
          {status}
        </p>
      ) : null}

      {tab === "overview" ? (
        <section className="stack">
          <div className="stat-grid">
            <div className="stat positive">
              <span>Total income</span>
              <strong>{formatMoney(totals.income)}</strong>
            </div>
            <div className="stat negative">
              <span>Total expenditure</span>
              <strong>{formatMoney(totals.expense)}</strong>
            </div>
            <div className="stat">
              <span>Balance in hand</span>
              <strong>{formatMoney(totals.balance)}</strong>
            </div>
          </div>
          <div className="panel">
            <h3 className="panel-title">Balances by fund</h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fund</th>
                    <th>Kind</th>
                    <th>Income</th>
                    <th>Expense</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {perFund.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <p className="empty-state">Create a fund to begin.</p>
                      </td>
                    </tr>
                  ) : (
                    perFund.map((fund) => (
                      <tr key={fund.id}>
                        <td>
                          <strong>{fund.name}</strong>
                        </td>
                        <td>{fund.kind}</td>
                        <td>{formatMoney(fund.income)}</td>
                        <td>{formatMoney(fund.expense)}</td>
                        <td>
                          <strong>{formatMoney(fund.balance)}</strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "give" ? (
        <div className="stack">
          <form className="panel form-grid" onSubmit={saveTxn}>
            <h3 className="panel-title span-2">
              {txnForm.id ? "Edit entry" : "Record income or expense"}
            </h3>
            <label className="field">
              <span>Fund</span>
              <select
                className="select"
                required
                value={txnForm.fund_id}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, fund_id: e.target.value })
                }
              >
                <option value="">Select fund…</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Direction</span>
              <select
                className="select"
                value={txnForm.direction}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, direction: e.target.value })
                }
              >
                <option value="income">Income (giving)</option>
                <option value="expense">Expense (payment)</option>
              </select>
            </label>
            <label className="field">
              <span>Amount</span>
              <input
                className="input"
                type="number"
                min="1"
                step="0.01"
                required
                value={txnForm.amount}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, amount: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Category</span>
              <input
                className="input"
                value={txnForm.category}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, category: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Date</span>
              <input
                className="input"
                type="date"
                required
                value={txnForm.occurred_on}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, occurred_on: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Reference</span>
              <input
                className="input"
                value={txnForm.reference}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, reference: e.target.value })
                }
              />
            </label>
            <label className="field span-2">
              <span>Description</span>
              <textarea
                className="textarea"
                value={txnForm.description}
                onChange={(e) =>
                  setTxnForm({ ...txnForm, description: e.target.value })
                }
              />
            </label>
            <div className="row span-2">
              <button className="button" disabled={busy}>
                {busy
                  ? "Saving…"
                  : txnForm.id
                    ? "Update entry"
                    : "Record entry"}
              </button>
              {txnForm.id ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setTxnForm(emptyTxn)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <section className="panel">
            <h3 className="panel-title">Ledger</h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Fund</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Reference</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <p className="empty-state">No entries recorded yet.</p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((row) => (
                      <tr key={row.id}>
                        <td>{row.occurred_on}</td>
                        <td>{fundName(row.fund_id)}</td>
                        <td>
                          <span
                            className={`badge ${row.direction === "expense" ? "subtle" : ""}`}
                          >
                            {row.direction}
                          </span>
                        </td>
                        <td>{formatMoney(row.amount, row.currency)}</td>
                        <td>{row.reference || "—"}</td>
                        <td className="row end">
                          <button
                            className="icon-button"
                            title="Edit"
                            onClick={() =>
                              setTxnForm({ ...row, amount: String(row.amount) })
                            }
                          >
                            ✎
                          </button>
                          <button
                            className="icon-button"
                            title="Delete"
                            onClick={() => removeRow("transactions", row.id)}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "funds" ? (
        <div className="stack">
          <form className="panel form-grid" onSubmit={saveFund}>
            <h3 className="panel-title span-2">
              {fundForm.id ? "Edit fund" : "New fund"}
            </h3>
            <label className="field">
              <span>Name</span>
              <input
                className="input"
                required
                value={fundForm.name}
                onChange={(e) =>
                  setFundForm({ ...fundForm, name: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Kind</span>
              <select
                className="select"
                value={fundForm.kind}
                onChange={(e) =>
                  setFundForm({ ...fundForm, kind: e.target.value })
                }
              >
                {FUND_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label className="field span-2">
              <span>Description</span>
              <textarea
                className="textarea"
                value={fundForm.description}
                onChange={(e) =>
                  setFundForm({ ...fundForm, description: e.target.value })
                }
              />
            </label>
            <div className="row span-2">
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : fundForm.id ? "Update fund" : "Create fund"}
              </button>
              {fundForm.id ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setFundForm(emptyFund)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <section className="panel">
            <h3 className="panel-title">Funds</h3>
            <div className="mini-list">
              {funds.length === 0 ? (
                <p className="empty-state">No funds yet.</p>
              ) : (
                funds.map((fund) => (
                  <div className="mini-item" key={fund.id}>
                    <div>
                      <strong>{fund.name}</strong>
                      <br />
                      <small>
                        {fund.kind} · {fund.description || "No description"}
                      </small>
                    </div>
                    <div className="row">
                      <button
                        className="icon-button"
                        title="Edit"
                        onClick={() =>
                          setFundForm({
                            ...fund,
                            description: fund.description || "",
                          })
                        }
                      >
                        ✎
                      </button>
                      <button
                        className="icon-button"
                        title="Delete"
                        onClick={() => removeRow("funds", fund.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "budgets" ? (
        <div className="stack">
          <form className="panel form-grid" onSubmit={saveBudget}>
            <h3 className="panel-title span-2">
              {budgetForm.id ? "Edit budget" : "New budget"}
            </h3>
            <label className="field">
              <span>Fund</span>
              <select
                className="select"
                required
                value={budgetForm.fund_id}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, fund_id: e.target.value })
                }
              >
                <option value="">Select fund…</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Period label</span>
              <input
                className="input"
                required
                placeholder="e.g. 2026"
                value={budgetForm.period_label}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, period_label: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Start</span>
              <input
                className="input"
                type="date"
                required
                value={budgetForm.period_start}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, period_start: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>End</span>
              <input
                className="input"
                type="date"
                required
                value={budgetForm.period_end}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, period_end: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Planned income</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={budgetForm.planned_income}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    planned_income: e.target.value,
                  })
                }
              />
            </label>
            <label className="field">
              <span>Planned expense</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={budgetForm.planned_expense}
                onChange={(e) =>
                  setBudgetForm({
                    ...budgetForm,
                    planned_expense: e.target.value,
                  })
                }
              />
            </label>
            <label className="field span-2">
              <span>Notes</span>
              <textarea
                className="textarea"
                value={budgetForm.notes}
                onChange={(e) =>
                  setBudgetForm({ ...budgetForm, notes: e.target.value })
                }
              />
            </label>
            <div className="row span-2">
              <button className="button" disabled={busy}>
                {busy
                  ? "Saving…"
                  : budgetForm.id
                    ? "Update budget"
                    : "Save budget"}
              </button>
              {budgetForm.id ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setBudgetForm(emptyBudget)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          <section className="panel">
            <h3 className="panel-title">Budgets</h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fund</th>
                    <th>Period</th>
                    <th>Planned income</th>
                    <th>Planned expense</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <p className="empty-state">No budgets yet.</p>
                      </td>
                    </tr>
                  ) : (
                    budgets.map((budget) => (
                      <tr key={budget.id}>
                        <td>{fundName(budget.fund_id)}</td>
                        <td>{budget.period_label}</td>
                        <td>{formatMoney(budget.planned_income)}</td>
                        <td>{formatMoney(budget.planned_expense)}</td>
                        <td className="row end">
                          <button
                            className="icon-button"
                            title="Edit"
                            onClick={() =>
                              setBudgetForm({
                                ...budget,
                                planned_income: String(budget.planned_income),
                                planned_expense: String(budget.planned_expense),
                                notes: budget.notes || "",
                              })
                            }
                          >
                            ✎
                          </button>
                          <button
                            className="icon-button"
                            title="Delete"
                            onClick={() => removeRow("budgets", budget.id)}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "pledges" ? (
        <div className="stack">
          <form className="panel form-grid" onSubmit={savePledge}>
            <h3 className="panel-title span-2">
              {pledgeForm.id ? "Edit pledge" : "New pledge"}
            </h3>
            <label className="field">
              <span>Member</span>
              <select
                className="select"
                value={pledgeForm.member_id}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, member_id: e.target.value })
                }
              >
                <option value="">— Anonymous —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Fund</span>
              <select
                className="select"
                value={pledgeForm.fund_id}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, fund_id: e.target.value })
                }
              >
                <option value="">— Unassigned —</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field span-2">
              <span>Purpose</span>
              <input
                className="input"
                placeholder="e.g. Building fund pledge"
                value={pledgeForm.purpose}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, purpose: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Amount pledged</span>
              <input
                className="input"
                type="number"
                min="1"
                step="0.01"
                required
                value={pledgeForm.amount_pledged}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, amount_pledged: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Amount received</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={pledgeForm.amount_received}
                onChange={(e) =>
                  setPledgeForm({
                    ...pledgeForm,
                    amount_received: e.target.value,
                  })
                }
              />
            </label>
            <label className="field">
              <span>Pledged on</span>
              <input
                className="input"
                type="date"
                required
                value={pledgeForm.pledged_on}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, pledged_on: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Due by (optional)</span>
              <input
                className="input"
                type="date"
                value={pledgeForm.due_on}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, due_on: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select
                className="select"
                value={pledgeForm.status}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="field span-2">
              <span>Notes</span>
              <textarea
                className="textarea"
                value={pledgeForm.notes}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, notes: e.target.value })
                }
              />
            </label>
            <div className="row span-2">
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : pledgeForm.id ? "Update pledge" : "Save pledge"}
              </button>
              {pledgeForm.id ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setPledgeForm(emptyPledge)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <section className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Pledge register</h3>
              <button
                className="button ghost"
                onClick={() =>
                  exportCsv(pledges, "aic-hola-pledges.csv", [
                    { label: "Member", value: (r) => memberName(r.member_id) },
                    { label: "Fund", value: (r) => fundName(r.fund_id) },
                    { label: "Purpose", value: (r) => r.purpose },
                    { label: "Pledged", value: (r) => r.amount_pledged },
                    { label: "Received", value: (r) => r.amount_received },
                    { label: "Outstanding", value: (r) => Number(r.amount_pledged) - Number(r.amount_received) },
                    { label: "Pledged on", value: (r) => r.pledged_on },
                    { label: "Status", value: (r) => r.status },
                  ])
                }
              >
                Export CSV
              </button>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Purpose</th>
                    <th>Pledged</th>
                    <th>Received</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pledges.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <p className="empty-state">No pledges recorded yet.</p>
                      </td>
                    </tr>
                  ) : (
                    pledges.map((row) => {
                      const outstanding =
                        Number(row.amount_pledged) - Number(row.amount_received);
                      return (
                        <tr key={row.id}>
                          <td>{memberName(row.member_id)}</td>
                          <td>
                            <strong>{row.purpose || "—"}</strong>
                            <br />
                            <small>{fundName(row.fund_id)}</small>
                          </td>
                          <td>{formatMoney(row.amount_pledged, row.currency)}</td>
                          <td>{formatMoney(row.amount_received, row.currency)}</td>
                          <td>
                            <strong>
                              {formatMoney(outstanding, row.currency)}
                            </strong>
                          </td>
                          <td>
                            <span
                              className={`badge ${row.status === "active" ? "subtle" : ""}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="row end">
                            <button
                              className="icon-button"
                              title="Edit"
                              onClick={() =>
                                setPledgeForm({
                                  ...row,
                                  amount_pledged: String(row.amount_pledged),
                                  amount_received: String(row.amount_received),
                                  due_on: row.due_on || "",
                                  notes: row.notes || "",
                                  member_id: row.member_id || "",
                                  fund_id: row.fund_id || "",
                                })
                              }
                            >
                              ✎
                            </button>
                            <button
                              className="icon-button"
                              title="Delete"
                              onClick={() => removeRow("pledges", row.id)}
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "approvals" ? (
        <div className="stack">
          <form className="panel form-grid" onSubmit={saveApproval}>
            <h3 className="panel-title span-2">
              {approvalForm.id ? "Edit request" : "Raise an expenditure request"}
            </h3>
            <p className="panel-sub span-2">
              Money leaving the church is requested here and approved by a
              treasurer. The database records who approved it and when.
            </p>
            <label className="field span-2">
              <span>Title</span>
              <input
                className="input"
                required
                value={approvalForm.title}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, title: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Fund</span>
              <select
                className="select"
                required
                value={approvalForm.fund_id}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, fund_id: e.target.value })
                }
              >
                <option value="">Select fund…</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Amount</span>
              <input
                className="input"
                type="number"
                min="1"
                step="0.01"
                required
                value={approvalForm.amount}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, amount: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Category</span>
              <input
                className="input"
                value={approvalForm.category}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, category: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Payee</span>
              <input
                className="input"
                value={approvalForm.payee}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, payee: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Needed by</span>
              <input
                className="input"
                type="date"
                value={approvalForm.needed_by}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, needed_by: e.target.value })
                }
              />
            </label>
            <label className="field span-2">
              <span>Justification</span>
              <textarea
                className="textarea"
                value={approvalForm.justification}
                onChange={(e) =>
                  setApprovalForm({
                    ...approvalForm,
                    justification: e.target.value,
                  })
                }
              />
            </label>
            <div className="row span-2">
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : approvalForm.id ? "Update request" : "Submit request"}
              </button>
              {approvalForm.id ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setApprovalForm(emptyApproval)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <section className="panel">
            <h3 className="panel-title">Approval queue</h3>
            <p className="panel-sub">
              Only a treasurer may approve, reject or settle a request. Settling
              writes the expense into the ledger automatically.
            </p>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Fund</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <p className="empty-state">No requests yet.</p>
                      </td>
                    </tr>
                  ) : (
                    approvals.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.title}</strong>
                          <br />
                          <small>
                            {row.payee || "—"}
                            {row.needed_by ? ` · needed by ${row.needed_by}` : ""}
                          </small>
                        </td>
                        <td>{fundName(row.fund_id)}</td>
                        <td>{formatMoney(row.amount, row.currency)}</td>
                        <td>
                          <span
                            className={`badge ${["approved", "paid"].includes(row.status) ? "" : "subtle"}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="row end wrap">
                          {row.status === "draft" ? (
                            <button
                              className="button ghost"
                              onClick={() => decideApproval(row, "pending")}
                            >
                              Submit request
                            </button>
                          ) : null}
                          {row.status === "pending" ? (
                            <>
                              <button
                                className="button ghost"
                                onClick={() => decideApproval(row, "approved")}
                              >
                                Approve
                              </button>
                              <button
                                className="button ghost"
                                onClick={() => decideApproval(row, "rejected")}
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                          {row.status === "approved" ? (
                            <button
                              className="button"
                              disabled={busy}
                              onClick={() => payApproval(row)}
                            >
                              Mark paid
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "reconcile" ? (
        <div className="stack">
          <form className="panel form-grid" onSubmit={saveAccount}>
            <h3 className="panel-title span-2">
              {accountForm.id ? "Edit bank account" : "New bank account"}
            </h3>
            <label className="field">
              <span>Account name</span>
              <input
                className="input"
                required
                value={accountForm.name}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, name: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Bank</span>
              <input
                className="input"
                value={accountForm.bank_name}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, bank_name: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Account number</span>
              <input
                className="input"
                value={accountForm.account_number}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    account_number: e.target.value,
                  })
                }
              />
            </label>
            <label className="field">
              <span>Statement balance</span>
              <input
                className="input"
                type="number"
                step="0.01"
                value={accountForm.statement_balance}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    statement_balance: e.target.value,
                  })
                }
              />
            </label>
            <div className="row span-2">
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : accountForm.id ? "Update account" : "Save account"}
              </button>
              {accountForm.id ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setAccountForm(emptyAccount)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <section className="panel">
            <h3 className="panel-title">Bank accounts</h3>
            <div className="mini-list">
              {accounts.length === 0 ? (
                <p className="empty-state">
                  Add a bank account to begin reconciling.
                </p>
              ) : (
                accounts.map((account) => (
                  <div className="mini-item" key={account.id}>
                    <div>
                      <strong>{account.name}</strong>
                      <br />
                      <small>
                        {[account.bank_name, account.account_number]
                          .filter(Boolean)
                          .join(" · ") || "No bank details"}
                        {" · statement "}
                        {formatMoney(account.statement_balance, account.currency)}
                        {account.reconciled_through
                          ? ` · reconciled through ${account.reconciled_through}`
                          : " · not reconciled"}
                      </small>
                    </div>
                    <div className="row">
                      <button
                        className="button ghost"
                        onClick={() => markReconciledThrough(account)}
                      >
                        Reconciled today
                      </button>
                      <button
                        className="icon-button"
                        title="Edit"
                        onClick={() =>
                          setAccountForm({
                            ...account,
                            statement_balance: String(account.statement_balance),
                          })
                        }
                      >
                        ✎
                      </button>
                      <button
                        className="icon-button"
                        title="Delete"
                        onClick={() => removeRow("bank_accounts", account.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Reconciliation worksheet</h3>
              <select
                className="select"
                style={{ maxWidth: 240 }}
                value={reconAccountId}
                onChange={(e) => setReconAccountId(e.target.value)}
              >
                <option value="">All transactions</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <span>Cleared</span>
                <strong>
                  {formatMoney(
                    transactions
                      .filter((t) => t.is_reconciled)
                      .reduce(
                        (sum, t) =>
                          sum +
                          (t.direction === "income"
                            ? Number(t.amount)
                            : -Number(t.amount)),
                        0,
                      ),
                  )}
                </strong>
              </div>
              <div className="stat negative">
                <span>Uncleared</span>
                <strong>
                  {formatMoney(
                    transactions
                      .filter((t) => !t.is_reconciled)
                      .reduce(
                        (sum, t) =>
                          sum +
                          (t.direction === "income"
                            ? Number(t.amount)
                            : -Number(t.amount)),
                        0,
                      ),
                  )}
                </strong>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Fund</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Bank</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter(
                      (t) => !reconAccountId || t.bank_account_id === reconAccountId,
                    )
                    .slice(0, 100).length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <p className="empty-state">Nothing to reconcile yet.</p>
                      </td>
                    </tr>
                  ) : (
                    transactions
                      .filter(
                        (t) =>
                          !reconAccountId || t.bank_account_id === reconAccountId,
                      )
                      .slice(0, 100)
                      .map((row) => (
                        <tr key={row.id}>
                          <td>{row.occurred_on}</td>
                          <td>{fundName(row.fund_id)}</td>
                          <td>{row.direction}</td>
                          <td>{formatMoney(row.amount, row.currency)}</td>
                          <td>
                            <select
                              className="select"
                              value={row.bank_account_id || ""}
                              onChange={async (e) => {
                                await supabase
                                  .from("transactions")
                                  .update({
                                    bank_account_id: e.target.value || null,
                                  })
                                  .eq("id", row.id);
                                await load();
                              }}
                            >
                              <option value="">— None —</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="row end">
                            <button
                              className={`badge ${row.is_reconciled ? "" : "subtle"}`}
                              onClick={() => toggleReconciled(row)}
                              title="Toggle cleared"
                            >
                              {row.is_reconciled ? "Cleared" : "Pending"}
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="stack">
          <section className="panel">
            <h3 className="panel-title">Reports &amp; statements</h3>
            <p className="panel-sub">
              Every report is generated from the live ledger. Export any of them
              to a spreadsheet for the church board or an auditor.
            </p>
            <div className="row wrap">
              <button
                className="button"
                onClick={() =>
                  exportCsv(transactions, "aic-hola-ledger.csv", [
                    { label: "Date", value: (r) => r.occurred_on },
                    { label: "Fund", value: (r) => fundName(r.fund_id) },
                    { label: "Direction", value: (r) => r.direction },
                    { label: "Category", value: (r) => r.category },
                    { label: "Amount", value: (r) => r.amount },
                    { label: "Currency", value: (r) => r.currency },
                    { label: "Reference", value: (r) => r.reference },
                    { label: "Description", value: (r) => r.description },
                    { label: "Cleared", value: (r) => (r.is_reconciled ? "Yes" : "No") },
                  ])
                }
              >
                Income &amp; expense ledger
              </button>
              <button
                className="button"
                onClick={() =>
                  exportCsv(perFund, "aic-hola-fund-statement.csv", [
                    { label: "Fund", value: (r) => r.name },
                    { label: "Kind", value: (r) => r.kind },
                    { label: "Income", value: (r) => r.income },
                    { label: "Expense", value: (r) => r.expense },
                    { label: "Balance", value: (r) => r.balance },
                  ])
                }
              >
                Fund statement
              </button>
              <button
                className="button"
                onClick={() =>
                  exportCsv(budgets, "aic-hola-budgets.csv", [
                    { label: "Fund", value: (r) => fundName(r.fund_id) },
                    { label: "Period", value: (r) => r.period_label },
                    { label: "Start", value: (r) => r.period_start },
                    { label: "End", value: (r) => r.period_end },
                    { label: "Planned income", value: (r) => r.planned_income },
                    { label: "Planned expense", value: (r) => r.planned_expense },
                  ])
                }
              >
                Budget vs actual
              </button>
              <button
                className="button"
                onClick={() =>
                  exportCsv(pledges, "aic-hola-pledges.csv", [
                    { label: "Member", value: (r) => memberName(r.member_id) },
                    { label: "Pledged", value: (r) => r.amount_pledged },
                    { label: "Received", value: (r) => r.amount_received },
                    { label: "Status", value: (r) => r.status },
                  ])
                }
              >
                Pledge fulfilment
              </button>
            </div>
          </section>

          <section className="panel">
            <h3 className="panel-title">Budget performance</h3>
            <p className="panel-sub">
              Planned against actual for every budget period across all funds.
            </p>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Fund</th>
                    <th>Planned in</th>
                    <th>Actual in</th>
                    <th>Planned out</th>
                    <th>Actual out</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <p className="empty-state">No budgets to compare.</p>
                      </td>
                    </tr>
                  ) : (
                    budgets.map((budget) => {
                      const inPeriod = transactions.filter(
                        (t) =>
                          t.fund_id === budget.fund_id &&
                          t.occurred_on >= budget.period_start &&
                          t.occurred_on <= budget.period_end,
                      );
                      const actualIn = inPeriod
                        .filter((t) => t.direction === "income")
                        .reduce((s, t) => s + Number(t.amount), 0);
                      const actualOut = inPeriod
                        .filter((t) => t.direction === "expense")
                        .reduce((s, t) => s + Number(t.amount), 0);
                      return (
                        <tr key={budget.id}>
                          <td>{budget.period_label}</td>
                          <td>{fundName(budget.fund_id)}</td>
                          <td>{formatMoney(budget.planned_income)}</td>
                          <td>{formatMoney(actualIn)}</td>
                          <td>{formatMoney(budget.planned_expense)}</td>
                          <td>{formatMoney(actualOut)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <h3 className="panel-title">Giving statement by member</h3>
            <p className="panel-sub">
              Total giving recorded against each member, ready to issue as an
              annual statement.
            </p>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Number</th>
                    <th>Total giving</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <p className="empty-state">
                          Add givers under the Givers tab first.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => {
                      const total = transactions
                        .filter(
                          (t) =>
                            t.member_id === member.id && t.direction === "income",
                        )
                        .reduce((s, t) => s + Number(t.amount), 0);
                      return (
                        <tr key={member.id}>
                          <td>
                            <strong>{member.full_name}</strong>
                          </td>
                          <td>{member.member_number || "—"}</td>
                          <td>{formatMoney(total)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "people" ? (
        <div className="stack">
          <form className="panel form-grid" onSubmit={saveMember}>
            <h3 className="panel-title span-2">
              {memberForm.id ? "Edit giver" : "Add a giver"}
            </h3>
            <label className="field">
              <span>Full name</span>
              <input
                className="input"
                required
                value={memberForm.full_name}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, full_name: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Member number</span>
              <input
                className="input"
                value={memberForm.member_number}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, member_number: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Phone</span>
              <input
                className="input"
                value={memberForm.phone}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, phone: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                className="input"
                type="email"
                value={memberForm.email}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, email: e.target.value })
                }
              />
            </label>
            <div className="row span-2">
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : memberForm.id ? "Update giver" : "Add giver"}
              </button>
              {memberForm.id ? (
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => setMemberForm(emptyMember)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <section className="panel">
            <h3 className="panel-title">Givers</h3>
            <div className="mini-list">
              {members.length === 0 ? (
                <p className="empty-state">
                  Add the people who give so their contributions can be tracked.
                </p>
              ) : (
                members.map((member) => (
                  <div className="mini-item" key={member.id}>
                    <div>
                      <strong>{member.full_name}</strong>
                      <br />
                      <small>
                        {[member.member_number, member.phone, member.email]
                          .filter(Boolean)
                          .join(" · ") || "No contact details"}
                      </small>
                    </div>
                    <div className="row">
                      <button
                        className="icon-button"
                        title="Edit"
                        onClick={() => setMemberForm(member)}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-button"
                        title="Delete"
                        onClick={() => removeRow("finance_members", member.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}
    </ConsoleLayout>
  );
}
