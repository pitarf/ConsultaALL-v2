'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      question: 'O que é o Consultas Brasil?',
      answer: 'O Consultas Brasil é uma plataforma de consultas online criada para reunir diferentes modalidades de pesquisa cadastral em um único ambiente. O usuário pode iniciar pesquisas utilizando CPF, CNPJ, telefone, placa ou nome conforme a informação disponível.'
    },
    {
      question: 'Quais tipos de consulta estão disponíveis?',
      answer: 'Estão disponíveis consultas por CPF, CNPJ, telefone, placa de veículos e pesquisa por nome. Cada modalidade conta com módulos organizados por categorias, permitindo selecionar somente os dados que você precisa verificar.'
    },
    {
      question: 'Preciso pagar mensalidade?',
      answer: 'Não. O Consultas Brasil opera no modelo pay-per-use, sem mensalidade obrigatória ou planos de fidelidade. Você adiciona saldo via Pix e utiliza estritamente nas consultas e módulos que escolher.'
    },
    {
      question: 'Como funciona uma consulta online?',
      answer: 'Você escolhe o tipo de pesquisa, digita o dado disponível e seleciona os módulos desejados. O sistema processa os parâmetros em tempo real, integrando bases oficiais e provedores parceiros para estruturar o relatório no painel.'
    },
    {
      question: 'Todas as consultas sempre encontram informações?',
      answer: 'Não. A quantidade de dados encontrados depende da existência de registros nos provedores e da informação pesquisada. Se nenhum dado for localizado na base, o saldo não é consumido indevidamente.'
    },
    {
      question: 'Os dados estão sempre atualizados?',
      answer: 'A atualização e a disponibilidade variam de acordo com a fonte pública ou o provedor consultado. Trabalhamos com integrações diretas para buscar sempre a versão cadastral mais recente disponível.'
    },
    {
      question: 'O Consultas Brasil é um serviço do governo?',
      answer: 'Não. O Consultas Brasil é uma plataforma privada e independente. Não representamos nem temos vínculo oficial com a Receita Federal, Detran, Senatran ou qualquer órgão público.'
    },
    {
      question: 'Como devo utilizar as informações encontradas?',
      answer: 'As informações obtidas devem ser utilizadas de maneira ética, responsável e estritamente em conformidade com a legislação aplicável, incluindo as diretrizes da Lei Geral de Proteção de Dados (LGPD).'
    }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 text-left">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-[#243b56] hover:text-[#10b981] transition-colors focus:outline-none"
            >
              <span className="pr-4 text-sm md:text-base">{faq.question}</span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-[#10b981] flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
            </button>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isOpen ? 'max-h-[300px] border-t border-slate-100' : 'max-h-0'
              }`}
            >
              <div className="px-6 py-5 text-slate-600 text-sm leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
