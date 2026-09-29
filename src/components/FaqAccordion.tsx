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
      question: 'Quais tipos de consulta estão disponíveis?',
      answer: 'A plataforma possui páginas e módulos relacionados à consulta de CPF, telefone, CNPJ, nome e placa de veículo. A disponibilidade de informações pode variar conforme o tipo de pesquisa e o módulo selecionado.'
    },
    {
      question: 'Preciso pagar mensalidade para usar o ConsultasBrasil?',
      answer: 'Não há mensalidade obrigatória. O usuário pode adicionar saldo ao painel e pagar somente pelas consultas e módulos utilizados.'
    },
    {
      question: 'Como o pagamento é realizado?',
      answer: 'O saldo pode ser adicionado por meio de Pix. Após a confirmação do pagamento, o valor é disponibilizado no painel conforme as regras da plataforma.'
    },
    {
      question: 'Os resultados são sempre completos?',
      answer: 'Não. A quantidade e a precisão das informações podem variar conforme os dados informados, a disponibilidade das fontes e a atualização dos registros.'
    },
    {
      question: 'Posso consultar qualquer pessoa?',
      answer: 'As consultas devem ser realizadas somente para finalidades legítimas e de acordo com a legislação aplicável. O usuário é responsável pela pesquisa realizada e pelo uso das informações obtidas.'
    },
    {
      question: 'É necessário informar a senha da pessoa pesquisada?',
      answer: 'Não. A plataforma não solicita senhas de redes sociais, contas bancárias, e-mails ou outros serviços pertencentes à pessoa pesquisada.'
    },
    {
      question: 'Como escolho a consulta correta?',
      answer: 'Acesse as páginas de consulta de CPF, telefone, CNPJ, nome ou placa e confira a explicação sobre os dados e módulos disponíveis em cada categoria.'
    },
    {
      question: 'Como entro em contato com o suporte?',
      answer: 'O atendimento deve ser solicitado pelos canais oficiais apresentados na página de contato ou dentro do painel do usuário.'
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
