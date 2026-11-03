/**
 * UTILITÁRIO DE EXPORTAÇÃO DE RELATÓRIOS EM PDF / IMPRESSÃO
 * Transforma dados de qualquer consulta (CPF, Nome, Telefone, E-mail, CNPJ, Veicular, Processos)
 * em um Dossiê Cadastral formatado e profissional para impressão ou salvamento em PDF.
 */

export interface ExportPdfOptions {
  data: any;
  title?: string;
  systemName?: string;
  query?: string;
  target?: string;
}

function formatCNJ(numero: string | number): string {
  if (!numero) return '';
  const clean = String(numero).replace(/\D/g, '');
  if (clean.length === 20) {
    return clean.replace(/^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/, '$1-$2.$3.$4.$5.$6');
  }
  return String(numero);
}

function formatDocumento(doc?: string): string {
  if (!doc) return '';
  const clean = String(doc).replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  return doc;
}

function formatData(dataStr?: string | null): string {
  if (!dataStr) return 'Não informada';
  try {
    const d = new Date(dataStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
  } catch {}
  return String(dataStr);
}

function formatMoeda(val?: number | string): string {
  if (val === undefined || val === null || val === '') return 'Não informado';
  const num = Number(val);
  if (!isNaN(num) && num > 0) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  }
  return String(val);
}

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateReportHtml({ data, title, systemName = 'ConsultasBrasil', query, target }: ExportPdfOptions): string {
  const emitidoEm = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  
  const protocolo = `DOSSIE-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const isDirectProcessos = Boolean(
    data && (Array.isArray(data?.processos) || (typeof data?.totalProcessos === 'number' && Boolean(data?.documentoConsultado || data?.processos)))
  );

  let bodyContentHtml = '';

  if (isDirectProcessos) {
    bodyContentHtml = renderProcessosHtml(data);
  } else if (data && typeof data === 'object') {
    bodyContentHtml = renderGenericSectionsHtml(data);
  } else {
    bodyContentHtml = `<div class="empty-state">Nenhum dado disponível para este relatório.</div>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || 'Relatório de Consulta')} - ${escapeHtml(systemName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      line-height: 1.5;
      font-size: 12px;
      -webkit-font-smoothing: antialiased;
    }

    .action-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .action-bar-info { display: flex; align-items: center; gap: 12px; font-size: 13px; }

    .action-bar-badge {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
    }

    .action-buttons { display: flex; gap: 10px; }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary { background: #059669; color: #ffffff; }
    .btn-primary:hover { background: #047857; }
    .btn-secondary { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.2); }

    .document-page {
      max-width: 860px;
      margin: 24px auto;
      background: #ffffff;
      padding: 36px 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }

    .report-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      text-transform: uppercase;
    }

    .brand-dot {
      width: 10px;
      height: 10px;
      background: #059669;
      border-radius: 50%;
      display: inline-block;
    }

    .report-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .header-meta { text-align: right; font-size: 11px; color: #475569; }

    .confidential-tag {
      display: inline-block;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .meta-line { margin-top: 2px; font-size: 10.5px; }
    .meta-line strong { color: #0f172a; }

    .section-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      margin-bottom: 18px;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .section-header {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .section-body { padding: 14px; }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 16px;
    }

    .fields-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px 16px;
    }

    .field-item {
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 5px;
    }

    .field-label {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .field-value {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      word-break: break-word;
    }

    .badge-status {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      width: fit-content;
    }
    .badge-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-alert { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .badge-info { background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 11px;
    }

    .data-table th {
      background: #f8fafc;
      color: #475569;
      text-align: left;
      padding: 6px 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 2px solid #e2e8f0;
    }

    .data-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: top;
    }

    .list-pill {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      border-radius: 6px;
      margin-bottom: 5px;
      font-size: 11.5px;
      color: #1e293b;
      display: block;
    }

    .processo-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .processo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }

    .processo-cnj {
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      color: #1e3a8a;
    }

    .report-footer {
      margin-top: 30px;
      border-top: 1px solid #cbd5e1;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      color: #64748b;
    }

    .legal-warning { max-width: 65%; line-height: 1.4; }
    .security-stamp { text-align: right; font-family: monospace; font-weight: 600; }

    @media print {
      body { background-color: #ffffff !important; font-size: 11px !important; }
      .action-bar { display: none !important; }
      .document-page { margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; width: 100% !important; max-width: 100% !important; }
      .section-card { border-color: #cbd5e1 !important; break-inside: avoid !important; page-break-inside: avoid !important; }
      .section-header { background: #0f172a !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .badge-status { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page { size: A4 portrait; margin: 14mm 10mm 14mm 10mm; }
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <div class="action-bar-info">
      <span class="action-bar-badge">Visualização de Impressão</span>
      <span>Dossiê pronto para exportação em PDF.</span>
    </div>
    <div class="action-buttons">
      <button class="btn btn-secondary" onclick="window.close()">Fechar</button>
      <button class="btn btn-primary" onclick="window.print()">Salvar em PDF / Imprimir</button>
    </div>
  </div>

  <div class="document-page">
    <header class="report-header">
      <div>
        <div class="brand-title">
          <span class="brand-dot"></span>
          ${escapeHtml(systemName)}
        </div>
        <div class="report-subtitle">${escapeHtml(title || 'Dossiê Cadastral & Relatório de Inteligência')}</div>
      </div>
      <div class="header-meta">
        <div class="confidential-tag">DOCUMENTO CONFIDENCIAL</div>
        <div class="meta-line">Protocolo: <strong>${protocolo}</strong></div>
        <div class="meta-line">Emissão: <strong>${emitidoEm}</strong></div>
        ${query ? `<div class="meta-line">Termo Consultado: <strong>${escapeHtml(query)}</strong></div>` : ''}
      </div>
    </header>

    <main>
      ${bodyContentHtml}
    </main>

    <footer class="report-footer">
      <div class="legal-warning">
        <strong>Conformidade LGPD (Lei nº 13.709/2018):</strong> Relatório gerado exclusivamente para finalidades legítimas e juridicamente fundamentadas. O solicitante assume total responsabilidade legal pelo sigilo e tratamento posterior das informações.
      </div>
      <div class="security-stamp">
        ${escapeHtml(systemName)}<br>
        AUTENTICAÇÃO: VERIFICADA
      </div>
    </footer>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.print(); }, 400);
    });
  </script>
</body>
</html>`;
}

function renderGenericSectionsHtml(data: Record<string, any>): string {
  let html = '';

  for (const [sectionKey, sectionContent] of Object.entries(data)) {
    if (!sectionContent || typeof sectionContent !== 'object') continue;

    const sKeyLower = sectionKey.toLowerCase();
    if (sKeyLower.includes('processo') || sKeyLower.includes('judicial')) {
      html += renderProcessosHtml(sectionContent, sectionKey);
      continue;
    }

    const title = sectionKey.replace(/_/g, ' ');
    const simpleFields: [string, any][] = [];
    const listFields: [string, any[]][] = [];
    const complexFields: [string, any][] = [];

    for (const [k, v] of Object.entries(sectionContent)) {
      if (Array.isArray(v)) {
        listFields.push([k, v]);
      } else if (v !== null && typeof v === 'object') {
        complexFields.push([k, v]);
      } else {
        simpleFields.push([k, v]);
      }
    }

    html += `
    <div class="section-card">
      <div class="section-header"><span>${escapeHtml(title)}</span></div>
      <div class="section-body">
    `;

    if (simpleFields.length > 0) {
      html += `<div class="fields-grid">`;
      for (const [k, v] of simpleFields) {
        html += `
          <div class="field-item">
            <span class="field-label">${escapeHtml(k.replace(/_/g, ' '))}</span>
            <span class="field-value">${formatSimpleValueHtml(k, v)}</span>
          </div>
        `;
      }
      html += `</div>`;
    }

    if (listFields.length > 0) {
      for (const [k, list] of listFields) {
        const listTitle = k.replace(/_/g, ' ');
        html += `<div style="margin-top: 14px;">`;
        html += `<div class="field-label" style="margin-bottom: 6px;">${escapeHtml(listTitle)} (${list.length})</div>`;
        
        if (list.length === 0) {
          html += `<div style="color: #94a3b8; font-style: italic;">Nenhum registro localizado.</div>`;
        } else {
          const first = list[0];
          if (first && typeof first === 'object' && (first.logradouro || first.cidade || first.cep)) {
            html += `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Logradouro</th>
                  <th>Número</th>
                  <th>Bairro</th>
                  <th>Cidade/UF</th>
                  <th>CEP</th>
                </tr>
              </thead>
              <tbody>
            `;
            for (const end of list) {
              html += `
                <tr>
                  <td>${escapeHtml(end.logradouro || '-')} ${end.complemento ? `(${escapeHtml(end.complemento)})` : ''}</td>
                  <td>${escapeHtml(end.numero || 'S/N')}</td>
                  <td>${escapeHtml(end.bairro || '-')}</td>
                  <td>${escapeHtml(end.cidade || '-')}/${escapeHtml(end.uf || '-')}</td>
                  <td>${escapeHtml(end.cep || '-')}</td>
                </tr>
              `;
            }
            html += `</tbody></table>`;
          } else {
            for (const item of list) {
              const text = typeof item === 'object' ? formatObjectToString(item) : String(item);
              html += `<div class="list-pill">• ${escapeHtml(text)}</div>`;
            }
          }
        }
        html += `</div>`;
      }
    }

    if (complexFields.length > 0) {
      for (const [subKey, subObj] of complexFields) {
        html += `
        <div style="margin-top: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
          <div class="field-label" style="color: #059669; margin-bottom: 8px;">${escapeHtml(subKey.replace(/_/g, ' '))}</div>
          <div class="fields-grid">
        `;
        for (const [sk, sv] of Object.entries(subObj)) {
          html += `
            <div class="field-item">
              <span class="field-label">${escapeHtml(sk.replace(/_/g, ' '))}</span>
              <span class="field-value">${formatSimpleValueHtml(sk, sv)}</span>
            </div>
          `;
        }
        html += `</div></div>`;
      }
    }

    html += `</div></div>`;
  }

  return html;
}

function renderProcessosHtml(data: any, customTitle?: string): string {
  const processos: any[] = Array.isArray(data?.processos) 
    ? data.processos 
    : Array.isArray(data?.Processos_Judiciais?.processos)
      ? data.Processos_Judiciais.processos
      : [];

  const total = data?.totalProcessos ?? processos.length;
  const doc = data?.documentoConsultado || data?.Documento || '';

  let html = `
    <div class="section-card">
      <div class="section-header">
        <span>${escapeHtml(customTitle || 'Processos Judiciais')}</span>
        <span>${total} ${total === 1 ? 'PROCESSO' : 'PROCESSOS'}</span>
      </div>
      <div class="section-body">
  `;

  if (doc) {
    html += `
      <div style="margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
        <span class="field-label">Documento Consultado</span>
        <span class="field-value" style="font-family: monospace; font-size: 13px;">${escapeHtml(formatDocumento(doc))}</span>
      </div>
    `;
  }

  if (processos.length === 0) {
    html += `
      <div style="padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; color: #166534; font-weight: 600;">
        ✓ Nada Consta: Nenhum processo judicial ativo localizado para este documento.
      </div>
    `;
  } else {
    for (const p of processos) {
      const cnj = formatCNJ(p.numeroProcesso || p.numero_processo);
      const tribunal = p.tribunal || p.orgaoJulgador?.tribunal || 'Tribunal de Justiça';
      const area = p.areaDireito || p.area_direito || 'Não informada';
      const status = p.detalhesStatusProcesso?.statusDetalhes || p.status || 'Em Andamento';
      const valor = formatMoeda(p.valorProcesso || p.valor_causa);
      const dataDist = formatData(p.dataDistribuicao || p.data_distribuicao);

      html += `
        <div class="processo-card">
          <div class="processo-header">
            <div>
              <div class="processo-cnj">${escapeHtml(cnj)}</div>
              <div style="font-size: 10.5px; color: #64748b; font-weight: 600; margin-top: 2px;">
                ${escapeHtml(tribunal)} • ${escapeHtml(area)}
              </div>
            </div>
            <span class="badge-status badge-info">${escapeHtml(status)}</span>
          </div>

          <div class="fields-grid-3" style="margin-bottom: 10px;">
            <div class="field-item">
              <span class="field-label">Distribuição</span>
              <span class="field-value">${escapeHtml(dataDist)}</span>
            </div>
            <div class="field-item">
              <span class="field-label">Valor da Causa</span>
              <span class="field-value">${escapeHtml(valor)}</span>
            </div>
            <div class="field-item">
              <span class="field-label">Comarca / Vara</span>
              <span class="field-value">${escapeHtml(typeof p.orgaoJulgador === 'object' ? (p.orgaoJulgador.comarca || p.orgaoJulgador.orgaoResponsavel || p.orgaoJulgador.unidadeOrigem || '-') : String(p.orgaoJulgador || '-'))}</span>
            </div>
          </div>
      `;

      if (Array.isArray(p.partes) && p.partes.length > 0) {
        html += `<div style="margin-top: 8px;"><div class="field-label" style="margin-bottom: 4px;">Partes do Processo</div>`;
        for (const parte of p.partes) {
          const polo = parte.polo ? `[${parte.polo}]` : '';
          const pos = parte.posicaoProcessual ? `(${parte.posicaoProcessual})` : '';
          const parteDoc = parte.documento ? ` - ${formatDocumento(parte.documento)}` : '';
          html += `
            <div style="font-size: 11px; padding: 3px 0; border-bottom: 1px dashed #f1f5f9;">
              <strong>${escapeHtml(polo)}</strong> ${escapeHtml(parte.nomeCompleto || parte.nome || 'Parte')} 
              <span style="color: #64748b;">${escapeHtml(pos)}${escapeHtml(parteDoc)}</span>
            </div>
          `;
        }
        html += `</div>`;
      }

      html += `</div>`;
    }
  }

  html += `</div></div>`;
  return html;
}

function formatSimpleValueHtml(key: string, value: any): string {
  if (value === null || value === undefined || value === '' || value === 'Não consta.') {
    return `<span style="color: #94a3b8; font-style: italic;">Não informado</span>`;
  }

  if (typeof value === 'boolean') {
    return value 
      ? `<span class="badge-status badge-success">Sim</span>`
      : `<span class="badge-status badge-danger">Não</span>`;
  }

  const k = key.toLowerCase();

  if (k === 'cpf' || k === 'cnpj' || k.includes('documento')) {
    return `<span style="font-family: monospace;">${escapeHtml(formatDocumento(String(value)))}</span>`;
  }

  if (k.includes('situacao')) {
    const vStr = String(value).toUpperCase();
    if (vStr.includes('ATIVA') || vStr.includes('REGULAR')) {
      return `<span class="badge-status badge-success">${escapeHtml(value)}</span>`;
    }
    if (vStr.includes('SUSPEN') || vStr.includes('PENDENTE') || vStr.includes('INAPTA')) {
      return `<span class="badge-status badge-alert">${escapeHtml(value)}</span>`;
    }
    if (vStr.includes('BAIXADA') || vStr.includes('CANCEL') || vStr.includes('NULA')) {
      return `<span class="badge-status badge-danger">${escapeHtml(value)}</span>`;
    }
  }

  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return escapeHtml(formatData(value));
  }

  if (k.includes('renda') || k.includes('capital') || k.includes('salario') || k.includes('faturamento') || k.includes('valor')) {
    if (!isNaN(Number(value)) && Number(value) > 0) {
      return `<span style="color: #15803d; font-weight: 700;">${escapeHtml(formatMoeda(value))}</span>`;
    }
  }

  return escapeHtml(String(value));
}

function formatObjectToString(item: any): string {
  if (!item || typeof item !== 'object') return String(item);
  const parts: string[] = [];
  for (const [k, v] of Object.entries(item)) {
    if (v && typeof v !== 'object') {
      parts.push(`${k.replace(/_/g, ' ')}: ${v}`);
    }
  }
  return parts.join(' | ') || JSON.stringify(item);
}

export function exportToPdf(options: ExportPdfOptions) {
  if (typeof window === 'undefined') return;

  const html = generateReportHtml(options);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
  }
}
