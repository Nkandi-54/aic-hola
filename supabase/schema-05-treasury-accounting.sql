-- ============================================================================
-- AIC HOLA — MIGRATION 05
-- TREASURY ACCOUNTING
-- ============================================================================
--
-- Run AFTER:
--   schema.sql
--   schema-02-roles-finance-records.sql
--   schema-03-accounts-admin.sql
--   schema-04-worship-audio.sql
--
-- Adds:
--   * Pledges
--   * Expenditure approvals
--   * Bank accounts
--   * Reconciliation
--   * Finance reports
--
-- IMPORTANT:
--   The existing public.transactions table remains the authoritative ledger.
--   This migration does NOT guess its column structure.
-- ============================================================================

begin;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'pledge_status'
  ) then
    create type public.pledge_status
      as enum ('active', 'fulfilled', 'cancelled');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'approval_status'
  ) then
    create type public.approval_status
      as enum (
        'draft',
        'pending',
        'approved',
        'rejected',
        'paid'
      );
  end if;
end
$$;

-- ============================================================================
-- 2. PLEDGES
-- ============================================================================

create table if not exists public.pledges (
  id uuid primary key default gen_random_uuid(),

  member_id uuid
    references public.finance_members(id)
    on delete set null,

  fund_id uuid
    references public.funds(id)
    on delete set null,

  purpose text not null default ''
    check (char_length(purpose) <= 500),

  amount_pledged numeric(14,2) not null
    check (amount_pledged > 0),

  amount_received numeric(14,2) not null default 0
    check (amount_received >= 0),

  currency text not null default 'KES'
    check (char_length(currency) between 3 and 3),

  pledged_on date not null default current_date,

  due_on date,

  status public.pledge_status not null default 'active',

  notes text not null default ''
    check (char_length(notes) <= 2000),

  created_by uuid not null default auth.uid()
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint pledges_due_after_pledge
    check (
      due_on is null
      or due_on >= pledged_on
    ),

  constraint pledges_received_not_above_pledged
    check (
      amount_received <= amount_pledged
    ),

  constraint pledges_fulfilled_amount
    check (
      status <> 'fulfilled'
      or amount_received >= amount_pledged
    )
);

create index if not exists pledges_member_idx
  on public.pledges (member_id);

create index if not exists pledges_fund_idx
  on public.pledges (fund_id);

create index if not exists pledges_status_idx
  on public.pledges (status, pledged_on desc);

-- Automatically maintain pledge status.
create or replace function public.sync_pledge_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.amount_received >= new.amount_pledged
     and new.status = 'active' then
    new.status := 'fulfilled';
  elsif new.amount_received < new.amount_pledged
     and new.status = 'fulfilled' then
    raise exception
      'A fulfilled pledge cannot have its received amount reduced below the pledged amount';
  end if;

  return new;
end;
$$;

drop trigger if exists sync_pledge_status
on public.pledges;

create trigger sync_pledge_status
before insert or update
on public.pledges
for each row
execute procedure public.sync_pledge_status();

-- ============================================================================
-- 3. EXPENDITURE REQUESTS
-- ============================================================================

create table if not exists public.expenditure_requests (
  id uuid primary key default gen_random_uuid(),

  title text not null
    check (char_length(btrim(title)) between 2 and 200),

  fund_id uuid not null
    references public.funds(id)
    on delete restrict,

  amount numeric(14,2) not null
    check (amount > 0),

  currency text not null default 'KES'
    check (char_length(currency) between 3 and 3),

  category text not null default ''
    check (char_length(category) <= 160),

  payee text not null default ''
    check (char_length(payee) <= 240),

  requested_by uuid not null default auth.uid()
    references public.profiles(id)
    on delete restrict,

  justification text not null default ''
    check (char_length(justification) <= 4000),

  needed_by date,

  status public.approval_status not null default 'pending',

  decided_by uuid
    references public.profiles(id)
    on delete restrict,

  decided_at timestamptz,

  decision_note text not null default ''
    check (char_length(decision_note) <= 4000),

  transaction_id uuid
    references public.transactions(id)
    on delete set null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint expenditure_decision_consistency
    check (
      status in ('draft', 'pending')
      or (
        decided_by is not null
        and decided_at is not null
      )
    )
);

create index if not exists expenditure_requests_status_idx
  on public.expenditure_requests (status, created_at desc);

create index if not exists expenditure_requests_requester_idx
  on public.expenditure_requests (requested_by, created_at desc);

create index if not exists expenditure_requests_fund_idx
  on public.expenditure_requests (fund_id, created_at desc);

-- ============================================================================
-- 4. BANK ACCOUNTS
-- ============================================================================

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),

  name text not null
    check (char_length(btrim(name)) between 2 and 120),

  bank_name text not null default ''
    check (char_length(bank_name) <= 160),

  account_number text not null default ''
    check (char_length(account_number) <= 80),

  currency text not null default 'KES'
    check (char_length(currency) between 3 and 3),

  statement_balance numeric(14,2) not null default 0,

  reconciled_through date,

  is_active boolean not null default true,

  created_by uuid not null default auth.uid()
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists bank_accounts_active_idx
  on public.bank_accounts (is_active, name);

-- ============================================================================
-- 5. TRANSACTION RECONCILIATION FIELDS
-- ============================================================================

alter table public.transactions
  add column if not exists bank_account_id uuid
    references public.bank_accounts(id)
    on delete set null;

alter table public.transactions
  add column if not exists is_reconciled boolean
    not null default false;

alter table public.transactions
  add column if not exists reconciled_at timestamptz;

create index if not exists transactions_bank_account_idx
  on public.transactions (bank_account_id);

create index if not exists transactions_reconciled_idx
  on public.transactions (
    fund_id,
    is_reconciled
  );

-- Reconciliation timestamp must agree with reconciliation state.
alter table public.transactions
  drop constraint if exists transactions_reconciliation_consistency;

alter table public.transactions
  add constraint transactions_reconciliation_consistency
  check (
    (
      is_reconciled = false
      and reconciled_at is null
    )
    or
    (
      is_reconciled = true
      and reconciled_at is not null
    )
  );

-- Ensure creator/recorded_by defaults exist for all finance tables
alter table if exists public.funds
  alter column created_by set default auth.uid();

alter table if exists public.finance_members
  alter column created_by set default auth.uid();

alter table if exists public.transactions
  alter column recorded_by set default auth.uid();

alter table if exists public.budgets
  alter column created_by set default auth.uid();

alter table if exists public.pledges
  alter column created_by set default auth.uid();

alter table if exists public.expenditure_requests
  alter column requested_by set default auth.uid();

alter table if exists public.bank_accounts
  alter column created_by set default auth.uid();

-- ============================================================================
-- 6. FINANCE REPORT REGISTER
-- ============================================================================

create table if not exists public.finance_reports (
  id uuid primary key default gen_random_uuid(),

  name text not null
    check (char_length(btrim(name)) between 2 and 160),

  kind text not null default 'summary'
    check (
      kind in (
        'summary',
        'income_expense',
        'fund_statement',
        'pledges',
        'reconciliation',
        'giving_statement'
      )
    ),

  period_start date,

  period_end date,

  parameters jsonb not null default '{}'::jsonb,

  generated_by uuid not null default auth.uid()
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint finance_reports_valid_period
    check (
      period_start is null
      or period_end is null
      or period_end >= period_start
    )
);

create index if not exists finance_reports_created_idx
  on public.finance_reports (created_at desc);

alter table if exists public.finance_reports
  alter column generated_by set default auth.uid();

-- ============================================================================
-- 7. EXPENDITURE DECISION ENFORCEMENT
-- ============================================================================

create or replace function public.enforce_expenditure_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  -- Paid expenditure cannot be altered in any way
  if old.status = 'paid' then
    raise exception
      'Paid expenditure cannot be changed';
  end if;

  if new.status is distinct from old.status then

    -- ------------------------------------------------------------------------
    -- Only a treasurer may approve/reject/pay.
    -- ------------------------------------------------------------------------

    if new.status in ('approved', 'rejected', 'paid') then

      if not public.is_treasurer() then
        raise exception
          'Only a treasurer may approve, reject or settle expenditure';
      end if;

      if new.status in ('approved', 'rejected') then
        new.decided_by := (select auth.uid());
        new.decided_at := now();
      elsif new.status = 'paid' then
        -- Preserve original approver, or fallback to current user if missing
        new.decided_by := coalesce(old.decided_by, (select auth.uid()));
        new.decided_at := coalesce(old.decided_at, now());
      end if;

    end if;

    -- ------------------------------------------------------------------------
    -- Valid state transitions.
    -- ------------------------------------------------------------------------

    if old.status = 'draft'
       and new.status not in ('draft', 'pending') then

      raise exception
        'Draft expenditure must be submitted before it can be decided';

    end if;

    if old.status = 'pending'
       and new.status not in (
         'pending',
         'approved',
         'rejected'
       ) then

      raise exception
        'Pending expenditure may only be approved or rejected';

    end if;

    if old.status = 'approved'
       and new.status not in (
         'approved',
         'paid'
       ) then

      raise exception
        'Approved expenditure may only remain approved or be paid';

    end if;

    if old.status = 'rejected'
       and new.status <> 'rejected' then

      raise exception
        'Rejected expenditure cannot be reopened';

    end if;

  end if;

  -- --------------------------------------------------------------------------
  -- Once paid, a ledger transaction MUST exist.
  --
  -- We deliberately do not fabricate the transaction here because the
  -- existing schema-02 transaction columns must remain authoritative.
  -- --------------------------------------------------------------------------

  if new.status = 'paid'
     and new.transaction_id is null then

    raise exception
      'Paid expenditure requires a linked ledger transaction';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_expenditure_decision()
from public;

revoke all on function public.enforce_expenditure_decision()
from anon;

grant execute
on function public.enforce_expenditure_decision()
to authenticated;

drop trigger if exists enforce_expenditure_decision
on public.expenditure_requests;

create trigger enforce_expenditure_decision
before update
on public.expenditure_requests
for each row
execute procedure public.enforce_expenditure_decision();

-- ============================================================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================================================

drop trigger if exists pledges_touch
on public.pledges;

create trigger pledges_touch
before update
on public.pledges
for each row
execute procedure public.touch_updated_at();

drop trigger if exists expenditure_requests_touch
on public.expenditure_requests;

create trigger expenditure_requests_touch
before update
on public.expenditure_requests
for each row
execute procedure public.touch_updated_at();

drop trigger if exists bank_accounts_touch
on public.bank_accounts;

create trigger bank_accounts_touch
before update
on public.bank_accounts
for each row
execute procedure public.touch_updated_at();

-- ============================================================================
-- 9. AUDIT TRIGGERS
-- ============================================================================

drop trigger if exists pledges_audit
on public.pledges;

create trigger pledges_audit
after insert or update or delete
on public.pledges
for each row
execute procedure public.log_audit();

drop trigger if exists expenditure_requests_audit
on public.expenditure_requests;

create trigger expenditure_requests_audit
after insert or update or delete
on public.expenditure_requests
for each row
execute procedure public.log_audit();

drop trigger if exists bank_accounts_audit
on public.bank_accounts;

create trigger bank_accounts_audit
after insert or update or delete
on public.bank_accounts
for each row
execute procedure public.log_audit();

-- ============================================================================
-- 10. RLS
-- ============================================================================

alter table public.pledges enable row level security;

alter table public.expenditure_requests enable row level security;

alter table public.bank_accounts enable row level security;

alter table public.finance_reports enable row level security;

-- ============================================================================
-- PLEDGES
-- ============================================================================

drop policy if exists "Treasurers manage pledges"
on public.pledges;

create policy "Treasurers manage pledges"
on public.pledges
for all
to authenticated
using (
  public.is_treasurer()
)
with check (
  public.is_treasurer()
);

-- ============================================================================
-- EXPENDITURE REQUESTS
-- ============================================================================

drop policy if exists "Treasurers read expenditure requests"
on public.expenditure_requests;

create policy "Treasurers read expenditure requests"
on public.expenditure_requests
for select
to authenticated
using (
  public.is_treasurer()
);

drop policy if exists "Requesters read own expenditure requests"
on public.expenditure_requests;

create policy "Requesters read own expenditure requests"
on public.expenditure_requests
for select
to authenticated
using (
  requested_by = (select auth.uid())
  and public.is_staff()
);

drop policy if exists "Staff raise expenditure requests"
on public.expenditure_requests;

create policy "Staff raise expenditure requests"
on public.expenditure_requests
for insert
to authenticated
with check (
  requested_by = (select auth.uid())
  and public.is_staff()
);

drop policy if exists "Requesters edit own drafts"
on public.expenditure_requests;

create policy "Requesters edit own drafts"
on public.expenditure_requests
for update
to authenticated
using (
  requested_by = (select auth.uid())
  and status = 'draft'
  and public.is_staff()
)
with check (
  requested_by = (select auth.uid())
  and status in ('draft', 'pending')
  and public.is_staff()
);

drop policy if exists "Treasurers decide expenditure requests"
on public.expenditure_requests;

create policy "Treasurers decide expenditure requests"
on public.expenditure_requests
for update
to authenticated
using (
  public.is_treasurer()
)
with check (
  public.is_treasurer()
);

-- ============================================================================
-- BANK ACCOUNTS
-- ============================================================================

drop policy if exists "Treasurers manage bank accounts"
on public.bank_accounts;

create policy "Treasurers manage bank accounts"
on public.bank_accounts
for all
to authenticated
using (
  public.is_treasurer()
)
with check (
  public.is_treasurer()
);

-- ============================================================================
-- REPORTS
-- ============================================================================

drop policy if exists "Treasurers manage finance reports"
on public.finance_reports;

create policy "Treasurers manage finance reports"
on public.finance_reports
for all
to authenticated
using (
  public.is_treasurer()
)
with check (
  public.is_treasurer()
);

-- ============================================================================
-- 11. PRIVILEGES
-- ============================================================================

revoke all
on public.pledges,
   public.expenditure_requests,
   public.bank_accounts,
   public.finance_reports
from anon, authenticated;

grant select, insert, update, delete
on public.pledges
to authenticated;

grant select, insert, update
on public.expenditure_requests
to authenticated;

grant select, insert, update, delete
on public.bank_accounts
to authenticated;

grant select, insert, update, delete
on public.finance_reports
to authenticated;

commit;