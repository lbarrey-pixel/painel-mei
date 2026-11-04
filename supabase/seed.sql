-- Dados fictícios para desenvolvimento. CNPJs gerados com dígitos verificadores válidos.
-- Troque o e-mail abaixo pelo da conta Google que vai entrar no painel.

insert into allowed_emails (email, added_by) values
  ('voce@example.com', 'seed');

insert into clientes (codigo, nome, cnpj, telefone, atividade, ativo, pausado, debito_automatico, dia_aviso_override, observacoes) values
  ('C01', 'Padaria do Bairro', '11222333000181', '+55 11 91234-0001', 'comercio', true, false, false, null, null),
  ('C02', 'Oficina Rápida', '22333444000181', '+55 11 91234-0002', 'servicos', true, false, true, null, 'Paga em débito automático'),
  ('C03', 'Estúdio Pixel', '33444555000181', '+55 11 91234-0003', 'servicos', true, true, false, null, 'Pausado a pedido do cliente'),
  ('C04', 'Mercearia Central', '44555666000181', '+55 11 91234-0004', 'comercio_servicos', true, false, false, 10, 'Prefere aviso mais cedo'),
  ('C05', 'Consultoria Alfa', '55666777000181', '+55 11 91234-0005', 'outra', false, false, false, null, 'Encerrou o MEI');
