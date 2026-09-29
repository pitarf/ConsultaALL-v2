# Manual do Usuário - ConsultasBrasil

## Consultas de Alta Performance
- **Velocidade e Precisão:** Utilize diferentes chaves (CPF, Nome, Telefone, E-mail). Graças ao nosso sistema de cache inteligente, se você buscar os mesmos dados nas últimas 48 horas, o resultado é instantâneo.
- **Transparência:** O sistema informa exatamente o custo de cada módulo antes de você confirmar a busca.

## Painel Financeiro e Usabilidade
- **Extrato Real:** Acompanhe cada movimentação de saldo. Recargas via Pix são creditadas automaticamente em segundos.
- **Fluxo Inteligente:** Faltou saldo? A plataforma sugere atalhos diretos e botões rápidos ("Recarregar Agora") para você colocar saldo sem interromper sua jornada.
- **Acessibilidade Mobile:** Uma experiência 100% responsiva. No celular, utilize o menu lateral (hambúrguer) para acessar facilmente o seu histórico, perfil e suporte.
- **Histórico Eterno:** Suas consultas ficam salvas para sempre. Você pode revisitar qualquer resultado anterior sem pagar nada a mais por isso.

## Segurança e Perfil
- **Login Instantâneo:** Acesse ou crie sua conta em segundos utilizando sua conta Google (Google OAuth2).
- **Proteção:** Suas informações e senhas (quando aplicável) são criptografadas com tecnologia de ponta.
- **Suporte Direto:** Em caso de dúvidas, utilize o botão de WhatsApp na barra lateral para falar com um atendente humano.

## Recursos de Administrador
- **Dashboard Analítico:** Visualize a saúde financeira do site e o ranking dos serviços mais procurados.
- **Modo Teste:** Possibilidade de realizar consultas de demonstração sem custo para validação do sistema.
- **Gestão de Auditoria:** Acesso completo aos logs de sistema para suporte técnico rápido ao cliente, incluindo a aba para monitorar solicitações de bloqueio de dados.
- **Gestão de Usuários e Ajustes de Saldo:** Capacidade de adicionar/remover saldos via Ajuste Simples ou validar transações Pix manualmente de forma rápida e simplificada (sem a necessidade de digitar o ID externo do Pix, caso o administrador queira apenas confirmar pelo valor recebido no banco), garantindo o crédito ágil na conta do cliente e o faturamento do site atualizado com precisão.

## Conformidade LGPD & Proteção de Dados (Opt-out)
- **Bloqueio de Visualização (Opt-out):** Em conformidade com a LGPD, os titulares de dados podem, a qualquer momento, solicitar o bloqueio e a restrição da exibição de suas informações de CPF nas buscas internas.
- **Como Solicitar:** Acesse o link "Proteção de Dados (LGPD)" no rodapé da página principal corporativa, preencha o formulário formal informando Nome, CPF, E-mail e o motivo. As solicitações são recebidas instantaneamente pelo administrador e processadas de forma prioritária em até 48 horas comerciais.

## Alternador de Visualização (Tema Clean / Dark)
Para proporcionar o maior conforto visual aos usuários e administradores da plataforma, implementamos um sistema dinâmico de temas:
- **Modo Clean (Claro):** Ideal para uso diurno ou ambientes corporativos, com excelente contraste, fundo branco leve e sombras sutis de design minimalista.
- **Modo Dark (Escuro):** Ideal para uso noturno ou sessões de busca prolongadas, reduzindo a fadiga ocular com o tradicional design glassmorphism premium.
- **Como Alternar:** No painel do usuário (`/dashboard`) ou painel de controle do administrador (`/admin`), clique no ícone de Sol ☀️ ou Lua 🌙 localizado no cabeçalho superior (ao lado do saldo da sua carteira). A plataforma memoriza instantaneamente a sua escolha para todas as próximas visitas. O alternador também está disponível no canto superior direito das telas de login e cadastro.## Gestão de Páginas SEO & Blog (Apenas Administradores)
No painel administrativo, há duas novas ferramentas para gerenciar a indexação orgânica e o tráfego do site:
- **Páginas SEO:** No menu lateral do admin, clique em "Páginas SEO". Lá você pode criar páginas personalizadas (ex: `/consulta-cpf`). Ao preencher o formulário, o sistema criará as meta tags corretas para o Google, adicionará a página ao Sitemap automático e cuidará dos cabeçalhos. Se você mudar a URL de uma página existente, o sistema fará um redirecionamento 301 automático (impedindo erros 404).
- **Blog & Conteúdo:** Clique em "Blog" para gerenciar artigos e categorias. Você pode cadastrar categorias de postagens e criar artigos completos informando autor, imagem de capa, descrição meta e o conteúdo em HTML rico. O blog ficará disponível publicamente em `/blog` para atrair tráfego e consolidar a marca de forma orgânica.

## Novidades da Versão (v0.9.1)

### 1. Teste de Busca Interativo na Homepage
Agora você pode experimentar a ferramenta antes mesmo de se cadastrar:
- Na página inicial do site, digite um CPF, Placa de Veículo ou Telefone no campo de busca.
- A plataforma simulará o processo de checagem em tempo real e exibirá uma prévia resumida (com dados parcialmente ocultos/mascarados) mostrando o que foi localizado.
- Para revelar o relatório completo, basta clicar no botão de revelação e criar sua conta grátis.

### 2. Busca Segura por Nome (Escolha de Homônimo)
Ao pesquisar por Nome e Sobrenome, o sistema exibe uma tela com os homônimos encontrados (com dados parciais mascarados de Nascimento e Mãe para identificação):
- A pesquisa inicial é inteiramente gratuita e serve para você confirmar que achou a pessoa certa.
- O seu saldo só será consumido no momento em que você clicar no perfil correspondente e confirmar a abertura da consulta detalhada.

### 3. Links Rápidos de Consulta
Na página inicial do site, você encontra atalhos diretos para as páginas explicativas de cada tipo de pesquisa:
- Consulta de CPF
- Consulta de telefone
- Consulta de placa
- Consulta de CNPJ
- Consulta por nome
Cada uma destas páginas explica o funcionamento técnico de cada consulta e a finalidade recomendada para cada busca.

