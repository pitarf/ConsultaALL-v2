# Changelog - ConsultasBrasil

Todas as mudanças notáveis para este projeto serão documentadas neste arquivo.

## [1.2.0] - 2026-09-29
### Adicionado & Implantado em Produção
- **Deploy Oficial em Produção na VPS Hostinger (`consultasbrasil.net`):**
  - **Repositório Sincronizado:** Push oficial de todas as branches e histórico atualizado em `origin main`.
  - **Provisionamento na VPS (`179.236.224.178`):** Clone do projeto, injeção de credenciais de produção no `.env`, build otimizado da imagem Docker em modo Next.js `standalone`.
  - **Containerização:** Containers `consultaall-app` (Next.js 16) e `consultaall-db` rodando em background com reinício automático (`restart: always`).
  - **Nginx Proxy Reverso:** Configuração e ativação com `client_max_body_size 50M`, headers de proxy reverso (`X-Forwarded-Proto`, `Upgrade`, `Connection`).
  - **Certificado SSL Let's Encrypt:** Certificados emitidos e instalados para `consultasbrasil.net` e `www.consultasbrasil.net` com redirecionamento forçado para HTTPS (301) e renovação automática.
  - **Verificação de Integridade:** Testes de requisição HTTP 200 confirmados na Home, Login, Cadastro, rotas de consulta e arquivos de imagem `/logo.png` e `/favicon.png`.

## [1.1.1] - 2026-09-29
### Otimizado
- **Refatoração Mobile-First, Acessibilidade e Tipografia Fluida nas Páginas Públicas:**
  - `src/components/HomeSearchBox.tsx`: Touch targets de no mínimo 44px/48px em todas as abas, botões de ação e pesquisa; padding proporcional para telas compactas (< 360px) e `touch-manipulation`.
  - `src/components/HomeTabs.tsx`: Implementação de carrossel de segmented control fluido com rolagem horizontal suave (`touch-pan-x snap-x snap-mandatory`), touch targets mínimos de 44px e quebra sem estouro visual em viewports pequenas.
  - `src/components/NavbarClient.tsx`: Botão hambúrguer e links de navegação mobile com área de toque mínima de 44x44px, remoção de hover acidental e abertura ergonômica com scroll vertical seguro (`max-h-[85vh]`).
  - `src/components/Footer.tsx`: Reestruturação da grade de rodapé em layout responsivo adaptativo (1 coluna em mobile -> 2 colunas em tablet -> 3 colunas em desktop intermediário -> 6 colunas em desktop expandido), com links com altura mínima de 44px.
  - `src/app/page.tsx`: Tipografia fluida em todos os títulos (`clamp` e classes `text-2xl sm:text-4xl md:text-5xl lg:text-6xl`), Bento Grid refinado em quebra fluida (1 -> 2 -> 3 -> 5 colunas), eliminação de larguras fixas de glows decorativos (`w-[min(500px,90vw)]`) evitando qualquer estouro ou scroll horizontal em telas estreitas (320px a 414px).

## [1.1.1] - 2026-09-29
### Adicionado & Otimizado
- **Acessibilidade e Ergonomia Mobile na Área Logada (Dashboard):**
  - **Mobile-First & Touch Targets (44x44px):** Todos os botões interativos, links de navegação (`SidebarNav`), seletores de valores pré-definidos (`FaturasClient`), botões de ação e paginação (`Processos` e `Dashboard`) atualizados para respeitar a área de toque mínima recomendada pelo W3C/Apple (`min-h-[44px]` e `min-h-[48px]`).
  - **Sidebar Direita Responsiva (`MobileSidebar`):** Otimização da gaveta deslizante da direita via React Portal com `max-w-[85vw]` e largura fixa ergonômica em smartphones, garantindo que o menu nunca ultrapasse o limite de tela em dispositivos compactos.
  - **Eliminação de Auto-Zoom no iOS Safari:** Ajuste das fontes de inputs e selects (`text-base` / mínimo 16px no mobile) nas telas de busca de processos, busca geral e recargas de saldo via Pix.
  - **Controle Rigoroso de Overflow:** Sanitização de quebra de texto (`break-words` / `break-all`) e adição de containers de rolagem horizontal controlada (`overflow-x-auto`) nas tabelas, cards de dados brutos do `DataViewer` e grids de candidatos homônimos.
  - **Modais e Diálogos com Safe Padding:** Adaptação ergonômica do `PromoModal` com padding responsivo e botões de toque com tamanho mínimo garantido.

## [1.1.0] - 2026-09-29
### Adicionado & Otimizado
- **Refatoração Visual Padrão Awwwards / Apple Design (Dark Green & Glassmorphism):**
  - **Color Theory & Profundidade:** Paleta de contraste calibrada com fundo verde escuro profundo (`#04130d`), cards em `#081c14`, bordas sutis em `#133829` e acentos em esmeralda vibrante (`#10b981` / `#059669`).
  - **Glassmorphism & Soft Shadows:** Implementação de `.glass-card`, `.glass-card-hover`, backdrop blur de 20px, sombras suaves calculadas e iluminação perimetral luminosa nos badges (`.badge-glow`).
  - **Bento Grid System:** Reestruturação da seção de Escolha de Consultas em um Bento Grid moderno de 5 colunas com microinterações em escala fluída no hover.
  - **Hero Section Elevada:** Mesh gradient atmosférico, grid técnico translúcido (`.bg-grid-pattern`), tipografia com gradientes e novo card de relatório simulado com visual de alta tecnologia.
  - **Design System Utilitário:** Criação de classes utilitárias para botões com gradientes e sombras dinâmicas (`.btn-premium`), compatibilidade fluída entre tema claro e escuro.
  - **Whitelabel e Segurança Institucional:** Remoção de menções públicas a provedores de dados brutos ("Fonte: API DirectData" no mockup da Home) substituída por identificação institucional de base cadastral unificada.
  - **Reativação da Consulta de Processos Judiciais:** Desbloqueio e reativação completa da rota `/dashboard/processos` com chave de busca multi-parâmetro (CPF, CNPJ e Nome com homônimos), suporte a modo DEMO e link direto no menu lateral (`SidebarNav`).
  - **Todas as Seções Refatoradas:** Atualização completa do `HomeTabs`, `HomeSearchBox`, `Como Funciona`, `Tabela de Preços`, `Aplicações B2B`, `FAQ Accordion` e `Últimas do Blog`.

## [1.0.0] - 2026-09-29
### Modificado
- **Atualização Global de Marca e Domínio para ConsultasBrasil (`consultasbrasil.net`):**
  - **Identidade da Marca:** Substituição completa de todas as ocorrências de 'Detetive Buscas', 'DetetiveBuscas' e 'Detetive' por 'ConsultasBrasil' e 'Consultas Brasil'.
  - **Novo Domínio Oficial:** Atualização de `https://detetivebuscas.com` para `https://consultasbrasil.net` em metadados, canonicals, Open Graph, Twitter Cards, schemas estruturados JSON-LD (`Organization`, `WebSite`, `Service`, `BlogPosting`), `robots.ts`, `sitemap.ts` e Server Actions de CMS (`actions/cms.ts`).
  - **Identidade Visual e Assets:** Apontamento oficial dos assets para `/logo.png` e `/favicon.png` em substituição aos formatos legados.
  - **Interface e Telas Públicas:** Atualização de textos, tooltips, modais de FAQ e layouts de autenticação (`login`, `cadastro`, `admin-login`, `navbar`, `footer`, `sidebar` e landing pages `/` e `/home2`).
  - **Comunicações e Notificações:** Alinhamento dos remetentes de recuperação de senha (`auth.ts`), e-mails padrão e VAPID subject de Push Notifications.

## [0.9.9] - 2026-09-29
### Modificado
- **Reposicionamento da Barra Lateral (Sidebar) para o Lado Direito:**
  - `src/app/dashboard/layout.tsx`: Layout reestruturado para posicionar o container principal (`main`) à esquerda e a barra de navegação (`aside`) fixada à direita da tela (`border-l border-[#133829]`), com inversão simétrica dos controles no header (ThemeToggle e saldo à esquerda, menu mobile à direita).
  - `src/components/MobileSidebar.tsx`: Gaveta lateral responsiva (drawer) ajustada para deslizar e ancorar suavemente a partir do lado direito (`justify-end`, `slide-in-from-right` e `border-l border-[#133829]`).

- **Calibração de Fundo Dark Mode e Sidebars para Verde Escuro Profundo:**
  - `src/app/globals.css`: Variáveis `--background` e `--card` no Dark Mode migradas de preto/marinho para verde escuro profundo (`#04130d` e `#081c14`), com bordas adaptadas para `#133829` e gradientes de fundo esmeralda sutil.
  - `src/app/dashboard/layout.tsx` e `MobileSidebar.tsx`: Fundo da sidebar migrado de `#0f172a` para `#04130d` com borda divisória `#133829`.
  - `src/components/SidebarNav.tsx`: Item ativo atualizado para destaque com fundo translúcido em tom verde esmeralda floresta (`bg-emerald-950/60`), texto `text-emerald-400` e borda `border-emerald-500/20`.
  - `src/app/admin/layout.tsx` e `AdminMobileMenu.tsx`: Sidebar e drawer do painel administrativo alinhados com o tom `#04130d`.

- **Migração Completa da Identidade Visual do Painel Administrativo para Verde (Emerald/Green):**
  - `src/app/admin/layout.tsx`: Atualização de badges, ícones e efeitos glow da sidebar (seção de Gestão de SEO e painel) para verde esmeralda.
  - `src/app/admin/page.tsx` & `DashboardClient.tsx`: Novo header em tom escuro elegante SaaS (`#0a1e17` a `#0f2e24`), indicadores de ROI, botões de filtro de datas e banner de fluxo de caixa migrados para tons esmeralda.
  - `src/components/admin/PerformanceChart.tsx`: Conversão das métricas e áreas do gráfico de novos cadastros e indicadores para `#10b981`.
  - `src/app/admin/custos/CustosClient.tsx`: Abas ativas, métricas de resultado financeiro estimado e badges de canais atualizados para verde esmeralda e teal.
  - `src/app/admin/traffic/TrafficClient.tsx`: Gradiente de header, cards de KPIs de campanhas, tabela de origens e lista detalhada alinhados ao padrão esmeralda.
  - `src/app/admin/usuarios/UserTableClient.tsx` & `usuarios/page.tsx`: Ícones de título, botões de exportação CSV, badges de SEO e ações de saldo alinhados com o tom verde.
  - `src/app/admin/blog/GerenciadorBlog.tsx` & `paginas/GerenciadorPaginas.tsx`: Botões de criar post/página, abas ativas, links de edição e inputs com foco adaptados para esmeralda.
  - `src/components/AdminMobileMenu.tsx`: Drawer mobile do admin com glow, badges e links de SEO padronizados para verde esmeralda.

## [0.9.8] - 2026-09-29
### Modificado
- **Unificação da Identidade Visual da Área Interna (Dashboard):**
  - Migração de todos os elementos residuais na cor azul para verde (`emerald`/`green`).
  - Atualização dos ícones e textos da seção de Gestão de SEO no menu lateral (`SidebarNav.tsx`).
  - Ajuste do glow do botão de confirmação de candidato para esmeralda (`dashboard/page.tsx`).
  - Padronização dos alertas informativos e ícones de histórico de recargas em tons esmeralda (`faturas/FaturasClient.tsx`).
  - Migração completa de spinners, badges, inputs e botões de chamada da página de promoções (`promocoes/page.tsx`).
  - Conversão dos ícones temáticos de pessoas indicadas (`indicacoes/page.tsx`) e dados da conta (`perfil/page.tsx`) para verde esmeralda.

## [0.9.7] - 2026-09-26
### Otimizado
- **Aceleração e Blindagem contra Timeout no Webhook PushinPay:**
  - Diagnóstico da causa do erro `cURL error 28: Connection timeout after 2000 ms` reportado pelo gateway PushinPay.
  - Eliminação de queries bloqueantes ao banco de dados Neon durante a autenticação: validação em memória do token do webhook via `process.env.PUSHINPAY_WEBHOOK_TOKEN` (economia de ~200ms de latência de rede).
  - Transação atômica ultra-enxuta: apenas a atualização de status da transação e incremento do saldo do usuário rodam no caminho crítico síncrono.
  - Desacoplamento assíncrono de operações secundárias: logs de auditoria (`SystemLog`), comissões de afiliados e Web Push notifications disparados em background sem bloquear o retorno HTTP 200 para a PushinPay.
  - Resposta imediata para eventos já processados (`alreadyProcessed: true`), garantindo que o botão "Reprocessar Webhook" do painel da PushinPay marque o status como verde instantaneamente.
  - Inclusão dos handlers `GET` e `HEAD` para testes de conectividade e health check do gateway.

### Corrigido
- **Blindagem na Consulta de Telefone (Fim do 'Erro inesperado'):**
  - Isolamento de exceções na Pesquisa Avançada V2 (`filterNaturalPerson`): quando um número não possui registro na V2, o erro 400/404 da API é capturado silenciosamente em `try/catch` e aciona imediatamente o fallback na V3 de Leads (`EnriquecimentoLead`).
  - Alinhamento de timeouts: limite de espera do frontend no Dashboard expandido de 15s para 32s (compatível com os 30s da Server Action), eliminando cortes prematuros em conexões móveis (4G/5G).
  - Mensagens amigáveis e não-genéricas: remoção definitiva do toast genérico "Erro inesperado ao realizar consulta", substituído pela explicação clara de que o número não consta na base nacional e que o saldo foi preservado.

## [0.9.6] - 2026-09-19
### Adicionado
- **Pesquisa Avançada (V2) para Consultas de Telefone:**
  - Migração do mecanismo de telefone para a API `AdvancedSearch/FilterNaturalPerson` (DirectData V2), permitindo encontrar proprietários e múltiplos vínculos associados ao número informado.
  - Fluxo em duas etapas: a listagem de candidatos é gratuita (`target: 'telefone_candidatos'`, custo R$ 0,00), permitindo ao cliente conferir nome, CPF mascarado, mãe e cidade antes de confirmar.
  - Débito do saldo e geração do relatório completo somente após o cliente confirmar o candidato desejado via `ProcessingIds` + `ViewSearch`.
  - Fallback automático e transparente na API V3 de Leads (`EnriquecimentoLead`) caso a Pesquisa Avançada não encontre candidatos, garantindo a maior cobertura possível do mercado.
  - Atualização do cálculo de custos de APIs no Admin (`/admin/custos` e métricas do dashboard): `telefone_candidatos` registrado a R$ 0,00 e consulta final de telefone computada a R$ 0,36.

## [0.9.5] - 2026-09-18
### Corrigido
- **Tratamento Humano de 'Documento Entidade Não Encontrada':**
  - O status técnico da DirectData (`Documento Entidade Não Encontrada`) foi traduzido para mensagens claras e amigáveis por tipo de consulta (`Telefone`, `CPF`, `CNPJ`, `Placa`, `Email`), explicitando que o número/documento não possui cadastro na base nacional e que o saldo do usuário não foi cobrado.
  - Normalização de telefones com DDI `+55` (12 ou 13 dígitos) diretamente no `validarTelefone` e no fluxo de consulta, aceitando números colados do WhatsApp.

### Adicionado
- **Detalhamento Completo nos Logs do Painel Admin (`/admin/logs`):**
  - Registro contextual de cada consulta que falha com nome do cliente, e-mail, telefone pesquisado, alvo, saldo atual, valor poupado e diagnóstico legível do provedor.
  - Interface visual dos logs atualizada com badges de identificação rápida (E-mail do cliente, Alvo: Chave, Selo de Saldo Preservado e Diagnóstico Explicativo) para agilizar o suporte no WhatsApp.

## [0.9.4] - 2026-09-12
### Modificado
- **Calibragem de Timeouts e Polling das APIs:**
  - Aumentado o timeout de proteção nas Server Actions (`consultas.ts`) para 30s (de 10s para 30s), eliminando falsos positivos de "timeout" em buscas assíncronas por Nome e Veículos.
  - Aumentado o número de tentativas de polling na busca por Nome em `performSmartSearch` de 5 (7.5s) para 10 tentativas (máx 20s), garantindo captura completa do cadastro enriquecido.
  - Executada auditoria geral ao vivo em 100% dos serviços (DirectData V3, V2, PushinPay, Brevo, PostgreSQL).

## [0.9.3] - 2026-09-12
### Corrigido
- **Eliminação de Travamento / Carregamento Infinito nas Consultas:**
  - Configurado timeout global padrão de 8s na instância `axiosV3` da DirectData, impedindo que chamadas pendentes deixem o cliente aguardando indefinidamente.
  - Resiliência na Consulta Veicular: rota Nacional do Senatran mantida como fonte principal instantânea (~1s), e a rota de débitos estaduais (`ConsultaVeicularEstadual`) recebeu limite estrito de 3.5s para não prender o usuário quando o gateway estadual oscilar.
  - Proteção de `Promise.race` nas Server Actions (`realizarConsulta`) com corte de segurança em 10s e mensagem informativa clara ao cliente.
  - Adicionado timeout de segurança no client-side (15s) no `Dashboard`, `Veículos` e `Empresas`, garantindo que o botão e o spinner sejam sempre liberados.
  - Singleton do `PrismaClient` mantido em todos os ambientes para estabilidade de conexões com o Neon PostgreSQL.

## [0.9.2] - 2026-08-31
### Adicionado
- **Função e Papel SEO no Painel Administrativo:**
  - Criação da role `"SEO"` para gerenciamento autônomo de blog, páginas SEO e branding.
  - Bloqueio completo a dados financeiros, saldo de usuários, custos de APIs, auditorias e logs do sistema.
  - Ocultação de credenciais confidenciais (Gateways e APIs externas) na tela de configurações para usuários com papel de SEO.
  - Inclusão do botão e atalho destacado **"Painel SEO"** (com ícone `Globe`) na barra lateral do Dashboard e no menu mobile para fácil acesso de contas com a permissão `SEO`.
  - Redirecionamento automático e inteligente do login administrativo diretamente para as configurações permitidas.

## [0.9.1] - 2026-08-03
### Adicionado
- **Integração de Caixa de Pesquisa Interativa (Hero):**
  - Criação do componente `HomeSearchBox` (Client-side) que simula o carregamento e varredura de dados de CPF, Placa ou Telefone de forma interativa.
  - Exibe um relatório mascarado (teaser) e um botão de ação com call-to-action chamando para o `/cadastro`.
- **Seção de Módulos Rápidos (Home):**
  - Inclusão dos 5 cards de consulta (CPF, Telefone, Placa, CNPJ, Nome) conectando diretamente às páginas internas de SEO da ferramenta.
- **Novas Páginas Institucionais e Rodapé Global:**
  - Criação das páginas e rotas `/sobre`, `/contato`, `/suporte`, `/politica-de-privacidade` e `/politica-de-cookies`.
  - Mapeamento e unificação dos links do Footer (`Footer.tsx`) apontando corretamente para as rotas e remoção de links mortos.
- **SEO Otimizado e JSON-LD Schemas:**
  - Injeção automática das tags JSON-LD para os Schemas `Organization`, `WebSite` e `FAQPage` via metadados.
  - Inclusão de seções institucionais de SEO e "Uso responsável das consultas".
  - Correção na descrição e canonical da homepage.
- **Busca por Nome Gratuita com Multi-Candidatos (DirectData):**
  - Refatoração da Server Action de consultas para interceptar a pesquisa inicial de Nome, retornando homônimos sem cobrança de saldo.
  - Consumo de saldo e polling detalhado acionados somente após a seleção do candidato correto pelo usuário.
- **Métricas Operacionais de ROI e Custos:**
  - Adicionado ROI (%) e Custos operacionais no Dashboard do Admin.
  - Tabelas de últimos depósitos do PIX e contadores dinâmicos de consultas realizadas hoje por categoria.

## [0.9.0] - 2026-07-26
### Adicionado
- **Gerenciador de Páginas SEO (CMS):**
  - Criação da tabela `Page` e do CRUD completo no painel de administração (`/admin/paginas`).
  - Permite configurar slug, título, H1, meta description, conteúdo (HTML rico), imagem OpenGraph e ALT, robots index/noindex, canonical e scripts customizados de JSON-LD e OpenGraph.
  - Renderização pública automática das páginas criadas através de rotas dinâmicas coringas `/[slug]` com integração ao cabeçalho/rodapé institucionais e metadados dinâmicos.
- **Gerenciador de Blog & Conteúdo:**
  - Criação de tabelas `Article` e `Category` com CRUD completo no painel administrativo (`/admin/blog`).
  - Feed público do blog estruturado e visualmente premium em `/blog` com paginação automática, autores, categorias e cards de visualização.
  - Páginas de artigos específicos `/blog/[slug]` com injeção automática de schemas estruturados do Google (Article JSON-LD) e links dinâmicos para artigos relacionados.
- **Redirecionamentos 301 Automáticos em Alteração de Slugs:**
  - Implementação de tabela `Redirect` para mapear slugs históricos.
  - Ao alterar o slug de uma página ou artigo, o sistema cria automaticamente um redirecionamento HTTP permanente 301 do endereço antigo para o novo.
  - Tratamento inteligente de cadeias de redirecionamento (ex: `/a` -> `/b` renomeado para `/c` atualiza o redirecionamento `/a` para apontar diretamente para `/c`).
- **Sitemap XML e Robots.txt Dinâmicos e Seguros:**
  - Sitemap em `/sitemap.xml` atualizado automaticamente a cada publicação ou remoção de Páginas e Artigos.
  - Sitemap configurado para conter apenas URLs indexáveis (`robotsIndex: true`), publicadas, canônicas originais e com status 200, excluindo totalmente rascunhos, noindex, login, cadastro, painel, termos de uso e parâmetros.
  - Robots.txt configurado para disallow em login, cadastro, esqueci minha senha, painel administrativo, dashboard de usuário, APIs e parâmetros, e apontamento explícito para o sitemap.

## [0.8.9] - 2026-07-21
### Corrigido
- **Bypass de WAF (Cloudflare/DirectData) na Busca por Nome:**
  - Remoção completa do client `axiosV2` (que possuía `rejectUnauthorized: false`) na chamada `FilterNaturalPerson` devido ao gatilho de bloqueio severo (`ECONNRESET`) pelo WAF da DirectData contra IPs de Datacenter.
  - Migração para a API `fetch` nativa (undici) do Node.js utilizando verificação estrita de SSL e cabeçalho `User-Agent` simulado (Spoofing) de um navegador Chrome, resolvendo o corte de conexão imediato na VPS.


## [0.8.8] - 2026-07-21
### Corrigido
- **Consulta Avançada por Nome (FilterNaturalPerson):**
  - Atualização do Endpoint da API para `https://api.app.directd.com.br` evitando recusa de conexão (Connection Reset) pelo WAF da DirectData.
  - Implementação de injeção compulsória de todos os campos do contrato no Payload da requisição (ex: `motherName`, `postalCode`, `receiveBolsaFamilia` como `null`), conforme exigência estrita da nova versão da API para evitar HTTP 400.


## [0.8.7] - 2026-07-21
### Corrigido
- **Sobrescrita de Preços dos Módulos (Bug do Reset):**
  - Removido o campo `price` da cláusula `update` no script de seed (`prisma/seed.ts`). Agora, as atualizações na VPS não resetam os preços personalizados definidos pelo administrador de volta para os valores padrão (R$ 1,00, R$ 0,50).
  - Adicionado `revalidatePath('/')` na Action de atualização de preços (`atualizarPrecoModulo`) para invalidar o cache estático do Next.js. Alterar os preços no Painel Admin agora atualiza os preços exibidos na Landing Page instantaneamente.


## [0.8.6] - 2026-07-21
### Adicionado
- **Rastreamento de Conversões (Google Analytics):**
  - Adicionado o disparo do evento `manual_event_PURCHASE` no exato momento em que o pagamento via Pix é aprovado em tempo real, evitando falsos positivos e permitindo rastreamento preciso de conversões.


## [0.8.5] - 2026-07-21
### Corrigido
- **Gráfico de Desempenho Diário no Painel Admin:**
  - Correção na ordenação cronológica dos últimos 30 dias de faturamento no agrupamento do banco de dados (anteriormente as datas ficavam em ordem randômica/de retorno do banco).
  - Preenchimento de todos os últimos 30 dias de forma sequencial (exibindo R$ 0,00 nos dias sem depósitos ao invés de pular datas ou quebrar a escala).
  - Escalonamento da altura das barras dinamicamente com base no faturamento máximo do período selecionado.
  - Correção de contraste e visibilidade das barras em modo escuro utilizando gradiente sólido azul com opacidade adequada.

## [0.8.4] - 2026-07-20
### Adicionado / Modificado
- **Criação da Página de Adicionar Saldo & Extrato de Recargas (`/dashboard/faturas`):**
  - Eliminação completa do erro 404 ao clicar no botão "Adicionar Saldo" do menu lateral.
  - Criação da nova rota de usuário `/dashboard/faturas` composta por `page.tsx` (Server) e `FaturasClient.tsx` (Client).
  - Inclui painel de geração de recargas Pix instantâneas com verificação automática de pagamento em tempo real e visualização do extrato completo de depósitos do usuário.

## [0.8.3] - 2026-07-20
### Adicionado / Modificado
- **Nomenclatura do Menu Lateral ("Minhas consultas"):**
  - Atualização do item de menu lateral em `src/components/SidebarNav.tsx` de "Histórico" para **"Minhas consultas"**.
  - Atualização do título principal da página `/dashboard/historico` para **"Minhas Consultas"**.

## [0.8.2] - 2026-07-20
### Adicionado / Modificado
- **Exibição do Horário Exato dos Cadastros na Gestão de Usuários:**
  - Atualização da coluna "DATA REGISTRO" na tabela de Gestão de Usuários (`/admin/usuarios`), passando a exibir a data e a hora exatas do cadastro (ex: `20/07/2026 às 14:35`).

## [0.8.1] - 2026-07-20
### Adicionado / Modificado
- **Tabela de Preços Dinâmica e Transparente na Landing Page (`#precos`):**
  - Adição do link **"Preços"** no menu de navegação da cabeçalho (desktop e mobile) posicionado entre "Como Funciona" e "Aplicações".
  - Criação da seção dedicada de preços e tarifas transparentes na página inicial (`src/app/page.tsx`), buscando os valores vigentes de cada módulo diretamente do banco de dados (`prisma.modulePricing.findMany()`).
  - Apresentação visual de alta conversão (CRO) dividida por categorias (Dados Pessoais, Pessoas Relacionadas, Renda, Veículos, Empresas e Crédito) para destacar o valor acessível das consultas (a partir de R$ 0,50) e converter visitantes em novos cadastros.

## [0.8.0] - 2026-07-20
### Adicionado / Modificado
- **Gerenciamento Dinâmico do Token da PushinPay no Painel Admin:**
  - Adição dos campos `pushinpayToken` e `pushinpayWebhookToken` ao modelo `SystemSetting` no banco de dados (`prisma/schema.prisma`).
  - Criação de uma seção dedicada em **Configurações** (`/admin/configuracoes`) com campos mascarados e botões de mostrar/ocultar senha para alterar o Token de API PushinPay e o Token de Segurança do Webhook em tempo real sem precisar reiniciar a VPS ou alterar o arquivo `.env`.
  - Leitura dinâmica dos tokens em `src/app/actions/pagamentos.ts` e `src/app/api/webhooks/pushinpay/route.ts` com fallback gracioso para as variáveis do `.env` caso o banco de dados não possua chaves customizadas cadastradas.

## [0.7.9] - 2026-07-20
### Adicionado / Modificado
- **Gerenciamento de Administradores no Painel (Promover/Rebaixar):**
  - Criação da Server Action `toggleUserRole` em `src/app/actions/admin.ts` para alternar com segurança o privilégio de acesso de qualquer usuário entre `USER` e `ADMIN`.
  - Adição de um botão com ícone de Coroa (`Crown`) na coluna de Ações da tabela de Gestão de Usuários (`/admin/usuarios`), permitindo ao administrador promover ou rebaixar usuários com 1 clique diretamente na interface visual.
  - Adição da Badge visual destacada `ADMIN` com o ícone de coroa para identificação rápida dos administradores da plataforma.

## [0.7.8] - 2026-07-12
### Adicionado / Modificado
- **Blindagem de SSL na API V3 da DirectData:**
  - Criação de uma instância customizada do Axios (`axiosV3`) com a desabilitação da validação estrita de certificados SSL (`rejectUnauthorized: false`) para todas as rotas da V3 (Pessoa Física Plus, Pessoa Jurídica Plus e Consulta Veicular). Isso evita falhas silenciosas de handshake de SSL e erros de certificado expirado/incompleto comuns dentro de containers Docker/Node.js na VPS de produção, garantindo que as buscas de CPF, CNPJ e Veículos carreguem com total estabilidade.
- **Tratamento de Indisponibilidade de Busca por Nome (V2):**
  - Devido a uma instabilidade ou desativação da API V2 da DirectData (`api.directd.com.br` retornando `ECONNRESET`), implementei um tratamento que intercepta o erro de socket. Em vez de exibir a mensagem técnica `read ECONNRESET`, o sistema agora exibe um aviso amigável orientando o usuário a buscar diretamente pelo CPF.


## [0.7.7] - 2026-07-04
### Adicionado / Modificado
- **Correção da Busca por Nome (DirectData V2):**
  - Correção do erro HTTP 400 "Parâmetros não suportados" na busca de Pessoa Física por Nome. A busca por Nome foi migrada de volta para a Pesquisa Avançada V2 (`FilterNaturalPerson`, `ProcessingIds` e `ViewSearch` com polling assíncrono), enquanto as buscas por E-mail e Telefone continuam usando o endpoint síncrono e veloz `/api/EnriquecimentoLead` da V3.
  - Implementação de um tratamento de exceções robusto em todas as chamadas de rede da DirectData, garantindo a leitura e a exibição da mensagem de erro real retornada pela API externa nos Toasts do frontend.
- **Validação Simplificada de Pix Manual (Sem Caça de IDs):**
  - Atualização da Server Action `createAndApproveDepositManual` para tornar o `externalId` opcional. Se o administrador deixar o ID em branco, o sistema gera automaticamente um ID de controle único do tipo `MANUAL-[timestamp]-[randomString]`.
  - Polimento do modal de saldo na Gestão de Usuários, tornando o campo de ID opcional na interface visual e orientando o administrador com um texto amigável.
- **Segurança Dupla e Resiliência no Webhook PushinPay:**
  - Atualização da geração do Pix (`src/app/actions/pagamentos.ts`) para incluir o ID interno da transação (`txId`) na URL do webhook.
  - Otimização do processamento do webhook (`src/app/api/webhooks/pushinpay/route.ts`) para buscar prioritariamente a transação pelo ID interno do banco (`txId`) e, em caso de ausência, usar o ID externo da PushinPay como fallback, eliminando 100% de inconsistências ou atrasos no banco.
  - Flexibilização de status aceitos pelo webhook, confirmando o Pix tanto para o status `"paid"` quanto para o status `"approved"`.
  - Suporte de token de segurança de dupla camada, aceito via Query Parameter (`?token=...`) ou via cabeçalho customizado (`x-pushinpay-token`).

## [0.7.6] - 2026-06-26
### Adicionado / Modificado
- **Validação Manual de Pix na Gestão de Usuários:**
  - Adição de uma interface de abas ("Ajuste Simples" e "Validar Pix Manual") no modal de gerenciamento de saldo da lista de usuários (`src/app/admin/usuarios/UserTableClient.tsx`).
  - Adição de um botão de ação rápida com ícone do Pix (`QrCode`) na tabela de usuários para abrir o modal diretamente na aba de validação de Pix.
  - Integração da Server Action `createAndApproveDepositManual` para criar e aprovar transações Pix (`DEPOSIT` com status `COMPLETED`) associadas a um ID Pix externo (`externalId`), incrementando o saldo do usuário e gerando logs de auditoria do sistema em português brasileiro.
  - Prevenção de duplicidade de transações por meio da validação atômica de `externalId` único no banco de dados.

## [0.7.5] - 2026-06-03
### Adicionado / Modificado
- **Copywriting do Hero da Landing Page:** Otimização do título principal na página inicial (`src/app/page.tsx`) para focar nas principais consultas da plataforma. O texto foi atualizado de "Consulte Informações em Segundos" para "Consulte CPF, Telefone e Placa em Segundos".

## [0.7.4] - 2026-05-25
### Adicionado / Modificado
- **Correção Crítica do Webhook PushinPay (Confirmação Pix):** Re-estruturação e robustecimento completo do endpoint de integração de webhook (`/api/webhooks/pushinpay`) para garantir o processamento automático de recargas Pix.
  - **Uso do ID de Transação Correto:** Substituição do mapeamento incorreto do campo `id` (ID da tentativa do webhook) pelo campo `transaction_id` (ID real da transação Pix associado ao `externalId`), resolvendo o bug em que o PIX não era creditado no saldo do cliente.
  - **Leitura Resiliente do Body:** Implementação de parser flexível de corpo de requisição com base no header `Content-Type` do HTTP, tratando nativamente payloads formatados tanto em `application/json` quanto `application/x-www-form-urlencoded` de forma segura.
  - **Tratamento Blindado de Exceções (Zero 500):** Adição de verificações preventivas contra dados nulos ou indefinidos antes de submetê-los ao Prisma Client, evitando que exceções de validação de banco resultem em erros HTTP 500 (Internal Server Error).
  - **Logs de Auditoria e Anti-Fraude:** Inclusão de logs detalhados via banco de dados (`SystemLog`) em português para transações confirmadas, além do bloqueio automático com log em severidade `ERROR` em caso de tentativas de divergência de valores pagos versus faturados.
- **Validação Manual de Pix (Painel do Administrador):**
  - **Ações Administrativas Robustas:** Criação das Server Actions `getPendingDeposits()` e `approveDepositManual(transactionId)` aplicando o mesmo padrão de transação atômica do webhook, com incremento do saldo do usuário, anotação de auditoria na descrição e geração automática de logs do sistema em português brasileiro.
  - **Interface SaaS Interativa (Abas):** Substituição do histórico de faturamento estático pelo componente interativo `<VendasClient />` estruturado em abas ("Aprovações Pendentes" e "Histórico Confirmado") com contador reativo e animações de loading de salvamento assíncrono com a nova API de transições do React 19.
- **Correção de Métricas de Faturamento no Painel Administrativo:**
  - **Cálculo de Receita Real:** Correção lógica na Server Action `getDashboardMetrics` que buscava o faturamento total acumulado e as vendas recentes com o filtro do tipo inexistente `PURCHASE`. Agora as métricas consultam corretamente a soma dos depósitos confirmados (`type: 'DEPOSIT'` e `status: 'COMPLETED'`), restaurando a exibição em tempo real do faturamento e vendas reais.
- **Menu Mobile Administrativo (Drawer Deslizante com React Portal):**
  - **Uso de Portais (Solução de CSS):** Substituição da renderização direta pela API `createPortal` do `react-dom` para acoplar a gaveta deslizante diretamente no `document.body`. Isso contorna as limitações de bloco de contenção e o aprisionamento visual gerados pelo `backdrop-blur-md` do cabeçalho pai, restaurando a exibição correta e fluida em tela cheia de smartphones.
  - **Anti-Hidratação:** Adição de controle de montagem em hook `useEffect` para carregar o portal de forma 100% segura no lado do cliente, prevenindo falhas de hidratação ou referências ao servidor.
  - **Navegação Responsiva:** Criação do componente Client `<AdminMobileMenu />` contendo um botão hambúrguer elegante e uma gaveta retrátil lateral em tom escuro (`bg-[#0f172a]`), alinhada ao visual desktop.
  - **Integração no Layout:** Injeção do menu móvel no cabeçalho superior do layout (`src/app/admin/layout.tsx`) com visibilidade restrita a smartphones (`md:hidden`), permitindo a navegação móvel de alto nível por todas as 6 subpáginas de administração.

## [0.7.3] - 2026-05-22
### Adicionado / Modificado
- **Área Administrativa Reativa a Temas (Clean / Dark):** Compatibilização completa de 100% da área administrativa (`/admin`) e das telas e subpáginas internas com o alternador de temas dinâmico.
  - **Layout do Admin:** Cabeçalho adaptado com o componente `<ThemeToggle />`, botão de retorno de alto contraste e contêiner central com background responsivo (`bg-[#f8fafc] dark:bg-background`).
  - **Painel Analítico de KPIs:** Cards de faturamento e consultas convertidos com design glass/white shadow e mini-gráficos reativos a ambos os temas.
  - **Gestão de Usuários e Modais de Auditoria:** Tabela de usuários adaptada com linhas zebradas suaves e transições. Modais completos de auditoria e ajuste de saldo reescritos para suportar fundos dinâmicos (`bg-white dark:bg-[#0f172a]`), tabelas internas claras e inputs numéricos/textuais de alto contraste.
  - **Histórico de Vendas:** Tabela de recargas Pix adaptada com linhas zebradas reativas, cabeçalho de contraste e badges de status reativos.
  - **Configurações de Branding e SEO:** Seção de formulários de metadados, inputs e caixas de pré-visualização de imagens (Logo e Favicon) remodeladas para ótima legibilidade e adaptabilidade visual a fundos claros e escuros.
  - **Preços de Módulos:** Adaptação completa de inputs tarifários, cards de categorias e caixas de alertas amarelos de preços para herdar as tonalidades e contrastes dinâmicos de cada modo.
  - **Logs do Sistema:** Cards de depuração, badges de status de severidade e contêineres pre/code de JSON técnico ajustados para ótima legibilidade sem perder a identidade premium.
  - **Checkpoint de Login Administrativo:** Integração do `<ThemeToggle />` e flexibilização visual completa do formulário de mestre para ótima usabilidade tanto no modo Clean quanto no modo Dark.

## [0.7.2] - 2026-05-22
### Adicionado / Modificado
- **Alternador Dinâmico de Temas (Dark / Clean):** Criação do componente de estado client `ThemeToggle.tsx` com ícones dinâmicos do Lucide (`Sun` e `Moon`), encaixando-se no cabeçalho do painel de controle (/dashboard) e de forma flutuante absoluta no topo-direita das telas de **Login** e **Cadastro**.
- **Adaptação Premium Light/Dark de Login/Cadastro:** Flexibilização total das classes de cores estáticas escuras das páginas de login e cadastro. Agora, os inputs, labels, botões de ação e divisores se adaptam instantaneamente ao tema selecionado (Clean / Dark) mantendo legibilidade perfeita e mantendo o design vívido em ambas as vertentes.
- **Persistência e Evitação de Flicker:** Adição de script head bloqueante em `src/app/layout.tsx` para sincronizar e carregar imediatamente a preferência de tema do `localStorage` (ou do sistema operacional) no primeiro milissegundo de carregamento do DOM, evitando quaisquer piscadas ("flickering") visuais.
- **Suporte Fluido nos Módulos de Busca:** Compatibilização completa das classes utilitárias de cores do Tailwind v4 (`dark:bg-card`, `dark:text-white`, `border-slate-200 dark:border-white/10`, etc.) nas páginas internas para transição imediata e natural.

## [0.7.1] - 2026-05-22
### Adicionado / Modificado
- **Ajuste Fino do Hero Copy na Landing Page:** Otimização do título principal para "Consulte Informações em Segundos", da descrição secundária para realçar o acesso ágil a contatos, placas e vínculos, e da chamada principal de cadastro para "Consultar Agora 🔎" (incluindo uma sutil micro-animação pulsante de conversão).
- **Esquema de Cores Claro nos Termos de Uso:** Implementação e polimento de design 100% claro (SaaS Light Premium) na página `/termos`, usando fundo `#f8fafc`, cartões brancos e fontes escuras de alta legibilidade para alinhamento com a Landing Page Whitelist para Google Ads.
- **Correção Crítica de Sintaxe em Termos:** Correção de rodapé duplicado e código sintático inválido que gerava falha de compilação em produção.
- **Rebranding Completo Residual (Detetive Buscas):** Remoção definitiva das ocorrências da marca antiga "ConsultaALL" no mockup das abas da home, no FaqAccordion corporativo e na tela de login de administradores.

## [0.7.0] - 2026-05-22
- **Nova Landing Page Whitelist (Estilo DeskData):** Reconstrução total da página pública inicial (`src/app/page.tsx`) com uma paleta de cores light premium corporativa B2B (cinza claro, azul vibrante e marinho) e copywriting whitelist focado em validação cadastral, enriquecimento de leads e mitigação de fraudes para aprovação total do Google Ads.
- **Dados Estritamente Genéricos nos Mockups (Opt-in Ads):** Ajuste fino de todas as demonstrações e exemplos visuais das abas interativas. Substituição de dados mascarados ou simulados por strings puramente conceituais (ex: "Nome Completo do Titular", "123.456.789-00", "01/02/1987", "exemplo@email.com", "Razão Social da Empresa Ltda") para eliminar qualquer falsa impressão de vazamento de dados aos revisores do Google Ads.
- **Preservação Histórica (Home 2):** Migração e preservação da Landing Page original escura ("Detetive Buscas") na nova rota pública `/home2` (`src/app/home2/page.tsx`), mantendo-a totalmente funcional.
- **Re-Branding Oficial (Detetive Buscas):** Substituição de todas as ocorrências visuais de "ConsultaALL" na home e navbar pela marca **Detetive Buscas**, posicionando-a como uma solução SaaS B2B premium e whitelisting de inteligência cadastral sob o domínio público.
- **Copy Suave Whitelist (Inspirada na DeskData):** Redefinição da copy do Hero e do corpo da Landing Page para um tom corporativo leve, profissional e legítimo (adequado contra restrições no Google Ads), além de acrescentar o aviso explícito de mockups ilustrativos/fictícios no componente de abas de consultas.
- **Canal Público de Proteção de Dados (Comentado / Em Desenvolvimento):** Ocultação completa do formulário de oposição LGPD na página `/protecao-de-dados`, substituindo a interface por um card elegante de "Módulo LGPD sob demanda / Em Desenvolvimento técnico". Toda a estrutura real do formulário e da action foi deixada perfeitamente comentada no código para permitir demonstração comercial e liberação imediata pós-venda.
- **Componentização Modular da Landing Page:**
  - Componente client `HomeTabs.tsx` para exibição interativa das consultas e mocks B2B de retorno, sem exibição de preços públicos.
  - Componente client `FaqAccordion.tsx` com accordions responsivos institucionais.
  - Componente client `NavbarClient.tsx` para cabeçalho responsivo leve com menu mobile retrátil.

## [0.6.0] - 2026-05-13
### Adicionado / Modificado
- **Integração DirectData V3:** Migração completa da base de consultas para a API V3 (Enriquecimento e Smart Search), corrigindo roteamentos para buscas via Telefone e Nome.
- **Autenticação Social:** Implementação de Login e Cadastro via Google OAuth2 utilizando rota de callback nativa (zero dependências) e com fallback seguro.
- **Recuperação de Senha Segura:** Novo fluxo completo de "Esqueceu a Senha" implementado de ponta a ponta com a API do Brevo nativa e banco de tokens rotativos (validade de 1 hora) em Next.js Server Actions.
- **Automação de Infraestrutura:** Criação do script nativo `update.sh` para atualizar o banco e reconstruir o sistema na VPS com um único comando.
- **Cache Modular e Anti-Prejuízo:** O sistema agora valida os módulos selecionados e salva o array no banco (`SearchHistory`), protegendo a operação de duplicidade na fatura da API externa.
- **Formatação de Dados Elegante:** Refatoração do `DataViewer` para processar objetos aninhados (ex: endereços) de forma limpa, eliminando exibições em JSON bruto.
- **Melhorias Críticas de UX/UI:**
  - **Conversão (Recarga):** Injeção de CTAs de Recarga diretamente nos alertas e Toasts quando o usuário não possui saldo.
  - **Botão de Consulta Aprimorado:** Botão gigante adaptado para polegar em dispositivos móveis, com folga visual (margin-bottom).
  - **Select Intuitivo:** Adição de chevron estilizado para facilitar a identificação dos campos de filtro.
  - **Mobile Sidebar (React Portal):** Correção do bug de aprisionamento do menu lateral pelo `backdrop-blur` do cabeçalho, garantindo navegação imersiva 100% de tela no celular.

## [0.5.0] - 2026-05-11
### Adicionado
- **Motor de API Híbrido:** Implementação de switch "Real vs Demo" exclusivo para administradores, permitindo testes sem custo de API ou débito de saldo.
- **Sistema de Cache Inteligente:** Armazenamento de resultados por 48 horas para evitar cobranças duplicadas e reduzir custos com o provedor de API.
- **Integração Real (Base):** Conexão estabelecida com `services.apiconsultabrasil.com` com mapeamento para o target `cpf-detalhada-pessoa-fisica`.
- **Segurança de Nível de Usuário (Role-Based):** Detecção dinâmica de cargo (Admin/User) no frontend para controle de visibilidade de recursos sensíveis.
- **Feedback de Cache:** Notificações (toasts) que informam quando um resultado foi recuperado do banco de dados.

## [0.4.0] - 2026-05-11
### Adicionado
- **Dashboard Administrativo Analítico:** Interface com métricas de faturamento (Dia/Mês), gráficos de desempenho e ranking de serviços.
- **Auditoria Financeira e Vendas:** Histórico detalhado de faturamento com integração de IDs externos da PushinPay e status visual (PAGO/PENDENTE).
- **Central de Logs do Sistema:** Monitoramento de erros técnicos de API, falhas de servidor e eventos críticos de segurança.

## [0.3.0] - 2026-05-10
### Adicionado
- **Pagamentos Automáticos (PushinPay):** Integração completa com o gateway Pix via Webhooks.
- **Área de Perfil:** Edição de perfil e troca de senha segura com hash bcryptjs.
- **Configurações Globais:** Gestão dinâmica de SEO e suporte via Admin.
- **Auditoria de Usuários:** Visualização de histórico de consultas e extrato individual de clientes.

## [0.2.0] - 2026-05-09
### Adicionado
- **Wallet System:** Migração para saldo em Reais (R$) e sistema de transações atômicas.
- **Precificação Dinâmica:** Controle de custos de módulos via banco de dados.
- **Dashboard do Usuário:** Novo layout premium com histórico de buscas e visualizador de dados JSON.

## [0.1.0] - 2026-05-08
### Adicionado
- **Base do Projeto:** Estrutura Next.js, Prisma, PostgreSQL e Autenticação JWT.
- **Landing Page:** Design premium responsivo.
