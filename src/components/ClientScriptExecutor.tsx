'use client';

import { useEffect, useRef } from 'react';

interface ClientScriptExecutorProps {
  scripts: string[];
}

/**
 * Componente cliente para executar scripts extraídos de páginas do CMS dinamicamente.
 * Cria elementos <script> reais no DOM, executa-os na montagem e limpa-os no desmonte.
 * Também vincula automaticamente a máscara de CPF, spinner e comportamento de redirecionamento
 * ao formulário de buscas da página como fallback, apenas se a página não tiver scripts próprios.
 */
export default function ClientScriptExecutor({ scripts }: ClientScriptExecutorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const addedScripts: HTMLScriptElement[] = [];

    // A. EXECUTA OS SCRIPTS CUSTOMIZADOS DO HTML
    if (scripts && scripts.length > 0) {
      scripts.forEach((code) => {
        if (!code.trim()) return;

        try {
          const scriptEl = document.createElement('script');
          scriptEl.type = 'text/javascript';
          scriptEl.textContent = code;
          
          containerRef.current?.appendChild(scriptEl);
          addedScripts.push(scriptEl);
        } catch (err) {
          console.error('Erro ao executar script dinâmico da página:', err);
        }
      });
    }

    // B. VINCULA COMPORTAMENTO AUTOMÁTICO DE CPF (Como fallback, apenas se não houver scripts)
    let cleanupCpfBehavior: (() => void) | undefined;

    const bindCpfFormBehavior = () => {
      // Se a página já possui scripts próprios executados, não ativa o fallback para evitar duplicidades
      if (scripts && scripts.length > 0) {
        return;
      }

      // Busca o campo de input do CPF por classes, placeholders ou atributos comuns
      const cpfInput = document.querySelector(
        'input[placeholder*="000."], input[id*="cpf"], input[name*="cpf"], input[inputmode="numeric"]'
      ) as HTMLInputElement;

      if (!cpfInput) return;

      // Mascara automática: 000.000.000-00
      const handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        let value = target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        
        let masked = '';
        if (value.length > 0) masked += value.substring(0, 3);
        if (value.length > 3) masked += '.' + value.substring(3, 6);
        if (value.length > 6) masked += '.' + value.substring(6, 9);
        if (value.length > 9) masked += '-' + value.substring(9, 11);
        
        target.value = masked;
      };

      cpfInput.addEventListener('input', handleInput);

      // Busca o formulário ou botão de consulta
      const form = document.querySelector('form');
      const submitBtn = document.querySelector(
        'button[type="submit"], button:has(svg), button.bg-gradient-primary'
      ) as HTMLButtonElement;

      const handleSubmit = async (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        const rawCpf = cpfInput.value.replace(/\D/g, '');
        
        // Aceita qualquer sequência de exatamente 11 números
        if (rawCpf.length !== 11) {
          const errorMsg = document.getElementById('search-panel-error') || document.querySelector('.text-destructive');
          if (errorMsg) {
            errorMsg.textContent = 'Por favor, digite um CPF válido com 11 dígitos.';
            errorMsg.classList.remove('opacity-0', 'h-0');
            errorMsg.classList.add('opacity-100', 'h-auto', 'mt-2.5');
          } else {
            alert('Por favor, digite um CPF válido com 11 dígitos.');
          }
          return;
        }

        // Oculta erro se houver
        const errorMsg = document.getElementById('search-panel-error');
        if (errorMsg) {
          errorMsg.classList.add('opacity-0', 'h-0');
          errorMsg.classList.remove('opacity-100', 'h-auto', 'mt-2.5');
        }

        // Ativa o spinner de carregamento no botão
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Consultando...
          `;
        }

        // Espera aproximadamente 1.2 segundo (1200ms)
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // Troca o texto para "Informações prontas para consulta"
        if (submitBtn) {
          submitBtn.innerHTML = 'Informações prontas para consulta';
          submitBtn.classList.remove('bg-gradient-primary');
          submitBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
        }

        // Espera mais 800ms e redireciona para o cadastro
        await new Promise((resolve) => setTimeout(resolve, 800));
        window.location.href = '/cadastro';
      };

      if (form) {
        form.addEventListener('submit', handleSubmit);
      } else if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmit);
      }

      // Retorna a função de limpeza local
      return () => {
        cpfInput.removeEventListener('input', handleInput);
        if (form) {
          form.removeEventListener('submit', handleSubmit);
        } else if (submitBtn) {
          submitBtn.removeEventListener('click', handleSubmit);
        }
      };
    };

    // Executa a vinculação após a montagem completa no DOM
    const timeoutId = setTimeout(() => {
      cleanupCpfBehavior = bindCpfFormBehavior();
    }, 100);

    // CLEANUP: Remove os scripts criados e os event listeners
    return () => {
      clearTimeout(timeoutId);
      if (cleanupCpfBehavior) cleanupCpfBehavior();
      
      addedScripts.forEach((scriptEl) => {
        if (scriptEl.parentNode) {
          scriptEl.parentNode.removeChild(scriptEl);
        }
      });
    };
  }, [scripts]);

  return <div ref={containerRef} style={{ display: 'none' }} />;
}
