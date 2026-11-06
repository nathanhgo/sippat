# Guia de uso do SIPPAT

Este guia é para quem usa o sistema no dia a dia do PAT. A ideia é explicar cada
tela em linguagem simples, sem termos técnicos.

## O que é o SIPPAT

É o sistema que guarda o cadastro das pessoas atendidas no PAT de Jacareí, o
histórico de atendimentos e as informações de perfil profissional e
socioeconômico. Ele também importa as planilhas que já são usadas hoje, para não
precisar digitar tudo de novo.

## Como entrar

1. Abra o endereço do sistema no navegador.
2. Digite seu **e-mail** e sua **senha**.
3. Clique em **Entrar**.

Se você não tem acesso, peça para um administrador criar seu usuário. Cada pessoa
deve usar o próprio login: é ele que fica registrado no histórico de quem fez
cada atendimento.

## Tela de Cidadãos

É a tela inicial depois do login. Mostra a lista de pessoas cadastradas.

### Procurar uma pessoa

No campo **Buscar cidadão**, digite parte do nome ou o CPF. A lista vai
filtrando enquanto você digita.

Para refinar, clique em **Filtros Avançados** e escolha bairro, escolaridade,
se a pessoa é PcD ou se faz parte de um público prioritário.

### Cadastrar uma pessoa nova

1. Clique em **Novo Cadastro**.
2. Preencha os dados básicos: **CPF**, **Nome Completo**, **Data de Nascimento**,
   **Gênero**, **Telefone** e **Bairro**.
3. Preencha, se souber, a parte socioeconômica: **Programas Sociais**, se é
   **PcD** e o **CID da Deficiência**.
4. Preencha a parte profissional: **Público Prioritário**, **Grau de
   Escolaridade**, **Cursos e Capacitações**, **Áreas em que gostaria de
   trabalhar** e o **Histórico de Experiências**.
5. Clique em **Salvar**.

O CPF é conferido na hora. Se o número estiver errado, o sistema avisa. Se a
pessoa já estiver cadastrada, ele também avisa, para você não criar duplicado.

### Ver todos os dados de uma pessoa

Clique no nome dela na lista. Abre uma janela com tudo o que está cadastrado,
inclusive o histórico de atendimentos.

### Editar um cadastro

Clique no ícone de lápis na linha da pessoa, mude o que precisa e clique em
**Salvar Cadastro**. O botão só fica disponível quando você altera alguma coisa.
O CPF não pode ser alterado.

### Excluir um cadastro

Clique no ícone de lixeira e confirme. A exclusão apaga também os atendimentos e
os perfis daquela pessoa. Use com cuidado: não tem como desfazer.

## Tela de Atendimentos

Mostra todos os atendimentos já registrados.

### Registrar um atendimento

1. Clique em **Registrar Atendimento**.
2. Digite o **CPF** da pessoa. Se ela já estiver cadastrada, o sistema mostra os
   dados e você pode aproveitar o cadastro em vez de digitar tudo de novo.
3. Escolha o **Tipo de Serviço** (encaminhamento, orientação, cadastro de vaga,
   atualização cadastral, emissão de documento ou outro).
4. Escreva as **Observações e Encaminhamentos**.
5. Preencha os dados do técnico: **Nome**, **Local de Trabalho** e **Contato**.
6. Clique em **Salvar**.

### Consultar atendimentos

Use a busca por nome da pessoa, o tipo de serviço, o nome do atendente ou um
período de datas. Os filtros ativos aparecem como etiquetas no topo da lista.

## Importação de planilhas

A tela de **Importação** serve para carregar as planilhas que o PAT já usa.

1. Escolha o tipo de planilha: **Formulário Oficial de Inclusão Produtiva**,
   **Planilha de Atendimentos e Encaminhamentos** ou **Planilha de Cadastros
   Padrão**.
2. Arraste o arquivo para a área indicada, ou clique para procurar no computador.
   O sistema aceita arquivos `.xlsx` e `.xls`.
3. Clique em **Analisar Planilha**.
4. Confira a pré-visualização. Se alguma pessoa já estiver cadastrada, o sistema
   pergunta o que fazer: **sobrescrever** os dados antigos ou **ignorar** a linha.
   Você pode decidir linha por linha ou aplicar a mesma escolha para todas.
5. Confirme a importação.

Vale sempre olhar a prévia antes de confirmar, porque a planilha pode ter linha
repetida ou dado incompleto.

## O selo de Público Prioritário

Quando a pessoa faz parte de um público prioritário para políticas públicas
(mulheres vítimas de violência, população em situação de rua, entre outros), o
nome dela aparece com um selo colorido na lista e nos detalhes. Isso ajuda a
identificar rapidamente quem tem prioridade no encaminhamento.

## Cuidados com os dados das pessoas

O sistema guarda dados pessoais e dados sensíveis. Alguns cuidados do dia a dia:

- Não compartilhe sua senha. Cada pessoa usa o próprio login.
- Não tire print de telas com CPF, telefone ou dados de saúde para mandar em
  grupo de WhatsApp.
- Não deixe a sessão aberta no computador quando sair da mesa. Use **Sair**.
- Se precisar exportar ou imprimir algo, faça só o necessário para o atendimento.

O sistema registra quem consultou e quem alterou dados sensíveis. Isso é uma
exigência da LGPD e serve para proteger tanto a pessoa atendida quanto o
servidor.

## Perguntas frequentes

**Esqueci minha senha.** Peça para um administrador redefinir. Não existe
recuperação automática por e-mail.

**Cadastrei a pessoa duas vezes, e agora?** Exclua o cadastro duplicado pela
lixeira, mas antes confira qual dos dois tem o histórico de atendimentos, para
não apagar o registro certo.

**A busca não acha a pessoa.** Tente pelo CPF, só com números. Se ainda não
achar, confira se o cadastro foi salvo.

**A importação não aceita meu arquivo.** Confira se ele é `.xlsx` ou `.xls` e se
é o modelo certo para o tipo de planilha escolhido.

**Posso usar no celular?** A tela funciona no navegador do celular, mas o
trabalho do dia a dia foi pensado para computador, com teclado.
