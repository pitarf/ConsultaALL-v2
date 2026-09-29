# Manual do Desenvolvedor - ConsultasBrasil

## Integração de API e Modo Híbrido (DirectData V3)
O sistema utiliza o arquivo `src/services/direct-data.ts` como ponte de comunicação.
- **Modo Real:** Ativado quando `isDemo: false`. Realiza as chamadas via `axiosV2` (V2) e `axiosV3` (V3) ignorando validação rígida de SSL (`rejectUnauthorized: false`), o que resolve falhas de carregamento e incompatibilidade de certificados em containers Docker.
- **Roteamento Inteligente:** O método `performSmartSearch` decide dinamicamente a rota dependendo do tipo da chave (`telefone`, `nome`, `email`, `cpf`).
- **Modo Demo:** Retorna dados de fallback (mock) sem acionar custos. Disponível apenas via painel UI se o usuário tiver `role: 'ADMIN'`.

## Autenticação e Segurança
- **Login Social (Google):** Fluxo OAuth2 puro (sem NextAuth) usando `/api/auth/google/callback/route.ts`. Trata erros invisíveis via `useSearchParams` encapsulados em `<Suspense>`.
- **Recuperação de Senha:** O fluxo "Esqueceu a Senha" salva chaves únicas na tabela `PasswordResetToken` (expiram em 1h). Os e-mails são disparados nativamente via API V3 do **Brevo** (`fetch`), economizando memória no container (sem precisar do pacote `nodemailer`).

## Sistema de Cache Modular (48 Horas)
Implementado na Server Action `realizarConsulta` (`src/app/actions/consultas.ts`).
- **Funcionamento:** O banco verifica se existe uma busca nas últimas 48h com o mesmo `type` (tipo), `query` (valor) E o mesmo array de `modules` (módulos comprados).
- **Cobrança Anti-Prejuízo:** O sistema sempre debita o valor dos módulos selecionados, mas o provedor de API não é chamado (custo de API = 0), mantendo a margem de lucro.

## Variáveis de Ambiente Necessárias (.env)
```env
# DirectData V3
DIRECT_DATA_TOKEN=seu_token_v3
DIRECT_DATA_V3_URL=https://apiv3.directd.com.br

# Google OAuth2
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# E-mail e Recuperação (Brevo)
BREVO_API_KEY=sua_chave_api_v3_do_brevo

# Pagamentos PushinPay
PUSHINPAY_TOKEN=token_do_gateway_pagamentos
PUSHINPAY_WEBHOOK_TOKEN=token_de_seguranca_do_webhook

# Banco de Dados (PostgreSQL Prisma)
DATABASE_URL=postgres://user:pass@host/db
```

## Tratamento de Dados (DataViewer)
O componente `src/components/DataViewer.tsx` foi refatorado para realizar uma leitura inteligente de arrays e JSONs aninhados. Em vez de despejar JSON puro na tela (o que afugenta o usuário), ele aplica o `formatObjectItem` transformando chaves em labels legíveis.

## Monitoramento de Logs
- **SystemLog:** Registra falhas de API, trocas de senha e confirmações de saldo. Visualizável no admin via interface dedicada.

## Canal de Proteção de Dados (Opt-out LGPD) e Whitelist
Para conformidade com o Google Ads e LGPD, a plataforma expõe uma rota `/protecao-de-dados`:
- **Estrutura:** A página `src/app/protecao-de-dados/page.tsx` usa componentes client interativos para gerenciar formulário, máscaras e feedbacks com Toasts.
- **Armazenamento sem Migrations:** O formulário consome a Server Action `registrarOptOut` (`src/app/actions/optout.ts`). Ela valida o CPF pelo motor interno e registra a solicitação diretamente na tabela `SystemLog` com o nível `WARNING`. Isso permite ao administrador realizar auditorias e dar baixa técnica em solicitações sem a necessidade de migrações complexas de esquema no PostgreSQL.
- **Componentização SSR:** A Landing Page principal (`src/app/page.tsx`) roda em modo de servidor (Server Component) para otimização extrema de SEO e metadados dinâmicos vindos da tabela `SystemSetting`. Elementos com estado dinâmico como abas (`HomeTabs`), accordions (`FaqAccordion`) e menus (`NavbarClient`) são carregados modularmente como Client Components híbridos.

## Reatividade de Temas Claro e Escuro (Clean / Dark) e Identidade Visual (Verde Esmeralda)
A plataforma possui suporte completo a temas dinâmicos em toda a sua área pública, painel do cliente (`/dashboard`) e área administrativa (`/admin`).
- **Paleta de Marca (Verde Esmeralda / Green):** A identidade visual do sistema utiliza como cor primária o verde esmeralda (`#10b981` / `#059669`), com gradientes e botões `.btn-premium` baseados em `from-emerald-600 to-green-600`, conferindo sofisticação e alta conversão tanto no modo claro quanto no escuro.
- **Prevenção de Flicadas (Anti-Flicker):** O `layout.tsx` injeta um scripthead síncrono que lê o `localStorage` no primeiro milissegundo de carregamento do DOM. Ele atribui a classe `.dark` ao elemento raiz `<html>` de forma síncrona antes que qualquer renderização ocorra, mitigando flashes brancos em visitas com modo escuro.
- **Alternador de Temas (`ThemeToggle.tsx`):** Componente cliente reativo que alterna o estado visual adicionando/removendo a classe `.dark` da raiz HTML e gravando a preferência no `localStorage`.
- **Estilização Adaptativa:** Utiliza as classes nativas de variantes `dark:` do Tailwind v4 (`bg-white dark:bg-card`, `text-slate-900 dark:text-white`, `border-slate-200 dark:border-white/10`) assegurando uma estética premium glassmorphism nos tons escuros e um design clean limpo e profissional nos tons claros.
- **Área Administrativa e Login de Checkpoint:** A mesma reatividade e paleta de cores flexíveis foram estendidas para 100% das páginas administrativas, tabelas de KPI, listagem de transações Pix, modais de auditoria técnica e telas de segurança de mestre.

## Padrões de Acessibilidade, Mobile-First e Interfaces Adaptativas
- **Touch Targets Ergonômicos (W3C / Apple HIG):** Todos os botões, links de menu, inputs e abas possuem dimensão de toque mínima de 44x44px ou 48px (`min-h-[44px]` ou `min-h-[48px]`), com `touch-manipulation` para eliminar atrasos de clique de 300ms e prevenir hovers acidentais em smartphones.
- **Tipografia Fluida:** Textos principais e títulos H1/H2 utilizam progressão proporcional (`text-2xl sm:text-4xl md:text-5xl lg:text-6xl`) para manter legibilidade sem quebras indesejadas em larguras de 320px a 414px.
- **Bento Grid Adaptativo:** Grids modulares quebram progressivamente em 1 coluna (mobile) -> 2 colunas (tablet/phablet) -> 3 colunas (desktop médio) -> 5 colunas (desktop largo / ultrawide).
- **Segmented Controls com Scroll e Snap:** Em telas móveis, as abas (`HomeTabs`) transformam-se em carrossel horizontal fluido com rolagem com momentum e snap (`overflow-x-auto no-scrollbar touch-pan-x snap-x snap-mandatory`), permitindo navegação rápida e sem estouro de largura.
- **Overflow Control Rigoroso:** Remoção de larguras fixas em pixels nos elementos decorativos e glows, utilizando `min(value, 90vw)` e `overflow-hidden` nas seções para garantir zero scroll horizontal.

## Validação Manual de Recarga Pix
Para resolver inconsistências de webhooks da PushinPay (especialmente em ambientes locais de teste ou quando a transação Pix é criada e paga mas não é registrada no banco de dados de produção por problemas do gateway):
- **Server Action**: `createAndApproveDepositManual(userId, externalId, amount)` em `src/app/actions/admin.ts`. Ela verifica a existência prévia do `externalId` para evitar duplicidade, insere o registro `DEPOSIT` com status `COMPLETED`, credita o saldo ao usuário e registra logs no `SystemLog`. O campo `externalId` é opcional. Se não for informado, a Server Action gerará automaticamente um ID único no formato `MANUAL-[timestamp]-[randomString]`.
- **Interface**: No modal de gerenciamento de saldo do usuário (`UserTableClient.tsx`), há uma aba "Validar Pix Manual". Ela permite creditar Pix de forma simplificada sem exigir que o administrador digite ou localize o ID do Pix na PushinPay.

## Busca por Nome (DirectData V2 & V3 Híbrido)
Para a realização de consultas de Pessoa Física na API da DirectData:
- **Buscas por Telefone e E-mail**: Utilizam a API síncrona V3 da DirectData (`/api/EnriquecimentoLead`), que é rápida e consome apenas uma requisição por chamada.
- **Busca por Nome**: Como a API V3 da DirectData não possui um correspondente síncrono para busca por Nome (o endpoint `/api/Similarity` exige o CPF para validar similaridade cadastral), o sistema utiliza a Pesquisa Avançada V2 da DirectData (`/api/AdvancedSearch/FilterNaturalPerson`, `/api/AdvancedSearch/ProcessingIds` e `/api/AdvancedSearch/ViewSearch` com polling assíncrono). A Server Action executa o fluxo em 3 etapas por baixo dos panos e realiza um polling rápido de até 10 tentativas para retornar o resultado síncrono traduzido para o frontend.

## Webhook PushinPay (Segurança Dupla e Resiliência)
A rota `/api/webhooks/pushinpay` conta com um processamento resiliente e autenticação de requisições:
- **Segurança de Camada Dupla**: Valida o token `PUSHINPAY_WEBHOOK_TOKEN` que pode vir via Query String (`?token=...`) na URL gerada ou via headers customizados (`x-pushinpay-token` ou `x-pushin-pay-token`).
- **Mapeamento de Transação Resiliente**: Na geração do Pix, a URL enviada à PushinPay inclui o parâmetro `txId` com o ID interno da transação. Ao receber a notificação, o webhook busca a transação primeiro pelo `txId` e, caso não o encontre, utiliza o `transaction_id` do body da PushinPay como fallback.
- **Vínculo Dinâmico**: Caso a transação seja encontrada via ID interno mas seu campo `externalId` ainda esteja em branco no banco de dados, o webhook atualiza o campo salvando o ID da PushinPay retroativamente.
- **Múltiplos Status de Confirmação**: O webhook aceita tanto o status `"paid"` quanto o status `"approved"` como confirmações válidas de Pix pago. Outros status são ignorados retornando HTTP 200 para evitar reenvios.## Gerenciador de Páginas SEO & Blog (CMS)
O sistema conta com um módulo completo de gerenciamento de conteúdo nas tabelas `Page`, `Category`, `Article` e `Redirect`.
- **Slugs Limpos:** Toda criação ou edição força os slugs a ficarem em caixa baixa, sem caracteres especiais ou espaços e limpa barras redundantes.
- **Redirecionamento 301 Automático:** Ao modificar o slug de uma página (`Page`) ou artigo (`Article`), uma Server Action insere um mapeamento na tabela `Redirect` (`oldSlug` -> `newSlug`). A rota dinámica `/[slug]` ou `/blog/[slug]` consulta esta tabela no momento do acesso. Se achar um redirecionamento, dispara um redirecionamento HTTP 301 Permanente via `permanentRedirect()`.
- **Tratamento de Cadeias (Loops):** Se houver uma cadeia de renomeações consecutivas (ex: `/a` renomeia para `/b` e depois `/b` renomeia para `/c`), as Server Actions atualizam recursivamente os registros de redirecionamento antigos para apontarem diretamente para a URL final `/c`, mitigando múltiplos saltos de redirecionamento desfavoráveis ao SEO.
- **Estruturação JSON-LD e Meta Tags:** Permite injeção de scripts personalizados de JSON-LD e configurações OpenGraph personalizadas, além de injeção automática de schemas do tipo `BlogPosting` para todos os posts de blog.

## Sitemap.xml & Robots.txt Dinâmicos
Ambas as rotas públicas utilizam geração dinâmica e servem arquivos síncronos baseados no banco de dados.
- **Sitemap (`/sitemap.xml`):** Lista a página inicial, termos de uso, políticas e as páginas e artigos criados pelo admin. Filtra ativamente para remover páginas não-indexáveis (`robotsIndex: false`), páginas não-publicadas (rascunhos), rotas privadas/logadas e redirecionadas.
- **Robots (`/robots.txt`):** Define diretivas para bots de busca, bloqueando caminhos de administração (`/admin`), área do cliente (`/dashboard/`), APIs (`/api/`), formulários de autenticação (`/login`, `/cadastro`, etc.) e links com query strings/parâmetros (`/*?*`). Contém o apontamento explícito para o sitemap usando o domínio configurado.

## Busca por Nome Otimizada e ROI no Dashboard (v0.9.1)

### 1. Pesquisa por Nome com Homônimos (Multi-Candidato)
Para evitar o consumo indevido de saldo do usuário ao pesquisar nomes comuns (homônimos), o processo foi dividido em duas etapas:
- **Etapa 1 (Gratuita)**: A chamada `performSmartSearch(nome)` executa apenas a rota grátis `FilterNaturalPerson` e retorna a lista de candidatos (homônimos encontrados) com dados mascarados (Nome, CPF mascarado, Data de Nascimento, Mãe, Cidade/UF). Nenhum saldo é debitado e nenhum polling de IDs é realizado.
- **Etapa 2 (Paga)**: Ao escolher e confirmar o candidato desejado pelo ID (`candidateId`), a Server Action de consultas realiza a chamada passando o parâmetro `candidateId`. O saldo é então debitado, e o sistema executa o fluxo completo de processamento e polling da DirectData para retornar os dados completos do candidato.

### 2. ROI e Custos Operacionais no Painel Admin
O painel administrativo (`/admin`) exibe agora indicadores diários de ROI e Custo de API calculados da seguinte forma:
- **Custo Operacional de API**: Calculado multiplicando cada consulta de sucesso efetuada pelo custo real cobrado pela API DirectData de acordo com o tipo de consulta.
- **Lucro Diário/Mensal**: Faturamento total menos custo de API.
- **ROI (%)**: `((Faturamento - Custo de API) / Custo de API) * 100`. Se o custo de API for zero, o ROI exibe `0%`.
- **Preenchimento de Lacunas**: A listagem de consultas diárias por categoria faz o pre-fill com zero para categorias sem buscas, evitando furos no layout.
- **Tabela de Depósitos Recentes**: Exibe a lista cronológica dos depósitos aprovados no dia no formato de hora local de Brasília (`America/Sao_Paulo`).

### 4. Resiliência e Blindagem Anti-Hang (Carregamento Infinito)
Para garantir que nenhuma consulta trave o frontend em carregamento infinito:
- **Timeouts em Camadas:**
  - `axiosV3` (`src/services/direct-data.ts`): Instanciado com `timeout: 8000` (8s padrão).
  - Micro-endpoints veiculares: Rota nacional do Senatran com 6s e gateway estadual com 3.5s estritos (se o Detran estadual demorar, a rota nacional já conclui e entrega o veículo em ~1s).
  - Processos Judiciais: Timeout de 5s para não atrasar a resposta de CPF/CNPJ.
  - Server Actions (`realizarConsulta`): Proteção com `Promise.race` de 30s cortando qualquer travamento externo e gerando mensagem amigável.
  - Client-side: `Promise.race` com 15s no `DashboardPage`, `VeiculosPage` e `EmpresasPage`, garantindo que o spinner seja sempre desligado.
- **Singleton PrismaClient:** Instância global persistida em todos os ambientes (`globalForPrisma.prisma = prisma`) para evitar esgotamento de sockets e conexões no pool do Neon PostgreSQL.

### 5. Tratamento de "Entidade Não Encontrada" e Auditoria de Falhas (/admin/logs)
- **Sanitização de Respostas da DirectData:** O status técnico `Documento Entidade Não Encontrada` retornado pelo backend da DirectData (`resultadoId: 6`) é interceptado por `sanitizeApiErrorMessage(rawMsg, target)`. O usuário final recebe uma explicação transparente ("Nenhum titular ou cadastro vinculado a este número de telefone foi localizado na base de dados nacional. Seu saldo não foi debitado.").
- **Logs Enriquecidos no Painel Admin (`/admin/logs`):** Em caso de falha ou registro não localizado, o `SystemLog` grava um payload completo estruturado contendo:
  - Dados do cliente: Nome, E-mail e Saldo no momento da busca.
  - Dados da consulta: Alvo (`telefone`, `cpf`, etc.), termo pesquisado, módulos e custo poupado.
  - Diagnóstico do provedor: Código do resultado, mensagem original do provedor e explicação de que o saldo foi preservado.
- **Badges Visuais no Admin:** A interface do `/admin/logs` extrai automaticamente o e-mail do cliente, o termo pesquisado e exibe o badge de "Saldo Preservado", permitindo ao suporte responder com rapidez ao cliente no WhatsApp.

### 6. Pesquisa Avançada (V2) para Telefone e Auditoria de Custos
- **Mecanismo Híbrido V2 + Fallback V3:**
  - **Etapa 1 (V2 Grátis):** Chamada inicial ao endpoint `AdvancedSearch/FilterNaturalPerson` com `{ phoneNumber: phone }`. Retorna a lista de titulares e vínculos encontrados (`isMultiple: true`). O termo é gravado em `searchHistory` com `target: 'telefone_candidatos'` e custo R$ 0,00.
  - **Etapa 2 (V2 Processamento Pago):** Quando o cliente clica no perfil desejado (`candidateId`), o backend aciona `AdvancedSearch/ProcessingIds` e realiza polling em `AdvancedSearch/ViewSearch` (até 20s). O saldo do cliente é debitado e a transação é registrada no histórico.
  - **Fallback V3 Transparente:** Caso a V2 não encontre nenhum candidato para o telefone, o sistema realiza uma tentativa automática na V3 de Leads (`EnriquecimentoLead?CELULAR=...`). Se localizar o cadastro diretamente, o saldo é debitado e o relatório completo é entregue sem necessidade de seleção.
- **Auditoria de Custos de APIs (`/admin/custos` e Dashboard Admin):**
  - As funções `calculateApiCostForSearch` e `calculateTotalApiCost` foram calibradas:
    - `telefone_candidatos` / `nome_candidatos`: Custo de API R$ 0,00 (Etapa 1 é gratuita no provedor).
    - `telefone` (V2 processamento) / `nome` (V2 processamento): Custo de API R$ 0,36.
    - `email` (V3 leads): Custo de API R$ 0,16.
    - `placa` / `veicular`: Custo de API R$ 1,10.
    - `cpf` / `cnpj`: Custo de API R$ 0,36.

### 7. Resiliência e Arquitetura Anti-Timeout do Webhook PushinPay
- **Timeout Estrito de 2000ms da PushinPay:** O gateway PushinPay possui um limite severo de timeout de 2.0 segundos (`CURLOPT_CONNECTTIMEOUT / CURLOPT_TIMEOUT = 2s`). Se a resposta ultrapassar 2000ms, o cURL aborta com status 0 (`cURL error 28: Connection timeout after 2000 ms`).
- **Solução de Aceleração Implementada (`/api/webhooks/pushinpay`):**
  - **Validação em Memória (0ms):** Compara o token primeiramente com `process.env.PUSHINPAY_WEBHOOK_TOKEN`, poupando uma ida de 200ms ao banco Neon.
  - **Transação Enxuta:** Somente as operações atômicas indispensáveis (atualizar a transação para `COMPLETED` e incrementar o saldo do usuário) rodam no caminho síncrono.
  - **Desacoplamento em Background:** Logs de auditoria (`SystemLog`), comissões de afiliados e Web Push notifications rodam de forma assíncrona após o commit, sem segurar a resposta HTTP.
  - **Idempotência Instantânea:** Se a transação já constar como `COMPLETED` (por aprovação manual do admin ou retentativa da PushinPay), a rota retorna HTTP 200 de imediato, permitindo que o botão "Reprocessar Webhook" no painel da PushinPay marque o status como verde com sucesso.




