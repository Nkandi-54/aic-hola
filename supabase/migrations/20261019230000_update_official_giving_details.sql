begin;

update public.church_settings
set
  paybill = '247247',
  paybill_account = '802200'
where id = 'primary';

update public.bank_accounts
set account_number = '802200'
where account_number = '01410637946150'
  and name = 'AIC Hola M-PESA Paybill Collection';

commit;
