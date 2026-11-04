-- Confere as policies com dois usuários: um liberado (está em allowed_emails) e um intruso.
-- Falha (exit != 0) se qualquer expectativa não bater.
\set ON_ERROR_STOP 1

do $$ begin
  assert cnpj_valido('11222333000181'), 'CNPJ válido rejeitado';
  assert not cnpj_valido('11222333000182'), 'dígito errado aceito';
  assert not cnpj_valido('11111111111111'), 'sequência repetida aceita';
end $$;

set role authenticated;

-- liberado
set request.jwt.claims = '{"email":"voce@example.com"}';
do $$ begin
  assert (select count(*) from clientes) = 5, 'liberado deveria ver os 5 clientes do seed';
  assert (select count(*) from allowed_emails) = 1, 'liberado deveria ver a allowlist';
end $$;
update config_geral set dia_aviso_padrao = 12 where id;
insert into clientes (nome, cnpj, telefone) values ('Novo', '66777888000181', '1');
do $$ begin
  assert (select dia_aviso_padrao from config_geral) = 12, 'update de config não aplicou';
  assert (select count(*) from clientes) = 6, 'insert do liberado não aplicou';
end $$;

-- CNPJ inválido barrado pelo banco, não só pelo front
do $$ begin
  begin
    insert into clientes (nome, cnpj, telefone) values ('Ruim', '66777888000182', '1');
    raise exception 'CNPJ inválido foi aceito';
  exception when check_violation then null;
  end;
end $$;

-- intruso
set request.jwt.claims = '{"email":"intruso@example.com"}';
do $$ begin
  assert (select count(*) from clientes) = 0, 'intruso viu clientes';
  assert (select count(*) from allowed_emails) = 0, 'intruso viu a allowlist';
  assert (select count(*) from config_geral) = 0, 'intruso viu a config';
  begin
    insert into clientes (nome, cnpj, telefone) values ('Hack', '77888999000181', '1');
    raise exception 'intruso conseguiu inserir';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
select 'RLS ok' as resultado;
