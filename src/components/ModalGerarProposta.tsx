import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ServicoSelecionado {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  valor: number;
  recorrente: boolean;
  unidade: string;
}

interface ModalGerarPropostaProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: {
    nome: string;
    empresa: string;
    email: string;
    telefone: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
  };
  servicos: ServicoSelecionado[];
  observacoes: string;
  valorTotal: number;
  onPropostaGerada: (documentoId: string, nomeArquivo: string) => void;
}

const ModalGerarProposta: React.FC<ModalGerarPropostaProps> = ({
  isOpen,
  onClose,
  cliente,
  servicos,
  observacoes,
  valorTotal,
  onPropostaGerada
}) => {
  const [validade, setValidade] = useState(30);
  const [condicoesPagamento, setCondicoesPagamento] = useState('30/60/90 dias');
  const [inicioEstimado, setInicioEstimado] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');
  const [garantia, setGarantia] = useState('90 dias');
  const [gerando, setGerando] = useState(false);
  const [propostaGerada, setPropostaGerada] = useState(false);

  const gerarPDF = () => {
    setGerando(true);

    try {
      // Guard: validar dados necessários
      if (!cliente || !cliente.nome) {
        console.error('❌ Dados do cliente inválidos:', cliente);
        alert('Erro: Dados do cliente não estão disponíveis');
        setGerando(false);
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPos = 20;

      // ========== HEADER COM GRADIENTE ==========
      // Fundo azul
      doc.setFillColor(59, 130, 246); // blue-500
      doc.rect(0, 0, pageWidth, 45, 'F');

      // Logo/Nome da empresa (esquerda)
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Creative Agency', margin, 25);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Soluções Criativas para seu Negócio', margin, 33);

      // PROPOSTA COMERCIAL (direita)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const propostaText = 'PROPOSTA COMERCIAL';
      const propostaWidth = doc.getTextWidth(propostaText);
      doc.text(propostaText, pageWidth - margin - propostaWidth, 25);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const dataText = `Data: ${dataAtual}`;
      const dataWidth = doc.getTextWidth(dataText);
      doc.text(dataText, pageWidth - margin - dataWidth, 33);

      const validadeText = `Validade: ${validade} dias`;
      const validadeWidth = doc.getTextWidth(validadeText);
      doc.text(validadeText, pageWidth - margin - validadeWidth, 38);

      yPos = 55;

      // ========== DADOS DO CLIENTE ==========
      doc.setFillColor(243, 244, 246); // gray-100
      doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');

      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55); // gray-800
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO CLIENTE', margin + 5, yPos + 8);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81); // gray-700
      
      doc.setFont('helvetica', 'bold');
      doc.text('Cliente:', margin + 5, yPos + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.nome, margin + 25, yPos + 16);

      doc.setFont('helvetica', 'bold');
      doc.text('Empresa:', margin + 5, yPos + 22);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.empresa, margin + 25, yPos + 22);

      doc.setFont('helvetica', 'bold');
      doc.text('Email:', margin + 5, yPos + 28);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.email, margin + 25, yPos + 28);

      doc.setFont('helvetica', 'bold');
      doc.text('Telefone:', pageWidth / 2, yPos + 28);
      doc.setFont('helvetica', 'normal');
      doc.text(cliente.telefone, pageWidth / 2 + 20, yPos + 28);

      yPos += 45;

      // ========== SERVIÇOS CONTRATADOS ==========
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text('SERVIÇOS PROPOSTOS', margin, yPos);

      yPos += 5;

      // Preparar dados da tabela
      const tableData = servicosArray.map((servico, index) => [
        (index + 1).toString(),
        servico.nome,
        servico.descricao,
        servico.recorrente ? `${servico.unidade} (recorrente)` : servico.unidade,
        `R$ ${servico.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);

      // Calcular valores
      const servicosRecorrentes = servicosArray.filter(s => s.recorrente);
      const servicosAvulsos = servicosArray.filter(s => !s.recorrente);
      
      const totalRecorrente = servicosRecorrentes.reduce((acc, s) => acc + s.valor, 0);
      const totalAvulso = servicosAvulsos.reduce((acc, s) => acc + s.valor, 0);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Serviço', 'Descrição', 'Tipo', 'Valor']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246], // blue-500
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [55, 65, 81]
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // gray-50
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 45, fontStyle: 'bold' },
          2: { cellWidth: 60 },
          3: { cellWidth: 35 },
          4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // ========== RESUMO FINANCEIRO ==========
      const boxWidth = 80;
      const boxHeight = totalRecorrente > 0 ? 35 : 25;
      const boxX = pageWidth - margin - boxWidth;

      doc.setFillColor(239, 246, 255); // blue-50
      doc.setDrawColor(59, 130, 246); // blue-500
      doc.setLineWidth(0.5);
      doc.rect(boxX, yPos, boxWidth, boxHeight, 'FD');

      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO FINANCEIRO', boxX + 5, yPos + 7);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      let resumoY = yPos + 14;
      
      if (totalAvulso > 0) {
        doc.text('Investimento único:', boxX + 5, resumoY);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${totalAvulso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, boxX + boxWidth - 5, resumoY, { align: 'right' });
        resumoY += 6;
      }

      if (totalRecorrente > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text('Investimento mensal:', boxX + 5, resumoY);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${totalRecorrente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, boxX + boxWidth - 5, resumoY, { align: 'right' });
        resumoY += 8;
      } else {
        resumoY += 2;
      }

      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.3);
      doc.line(boxX + 5, resumoY, boxX + boxWidth - 5, resumoY);
      resumoY += 5;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('TOTAL:', boxX + 5, resumoY);
      doc.setFontSize(12);
      doc.text(`R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, boxX + boxWidth - 5, resumoY, { align: 'right' });

      yPos += boxHeight + 15;

      // Verificar se precisa de nova página
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      // ========== CONDIÇÕES COMERCIAIS ==========
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 40, 'F');

      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text('CONDIÇÕES COMERCIAIS', margin + 5, yPos + 8);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);

      const condicoes = [
        `• Condições de Pagamento: ${condicoesPagamento}`,
        `• Prazo de Entrega: ${prazoEntrega || 'A definir após aprovação'}`,
        `• Início Estimado: ${inicioEstimado || 'Imediato após assinatura do contrato'}`,
        `• Garantia: ${garantia} para correções e ajustes`
      ];

      let condY = yPos + 16;
      condicoes.forEach(cond => {
        doc.text(cond, margin + 5, condY);
        condY += 6;
      });

      yPos += 48;

      // ========== OBSERVAÇÕES ==========
      if (observacoes && observacoes.trim()) {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('OBSERVAÇÕES', margin, yPos);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        const obsLines = doc.splitTextToSize(observacoes, pageWidth - 2 * margin - 10);
        doc.text(obsLines, margin + 5, yPos + 8);
        
        yPos += 8 + (obsLines.length * 5) + 10;
      }

      // ========== FOOTER COM CALL TO ACTION ==========
      const footerY = pageHeight - 40;
      
      doc.setFillColor(34, 197, 94); // green-500
      doc.rect(0, footerY, pageWidth, 40, 'F');

      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      const ctaText = 'Pronto para começar?';
      const ctaWidth = doc.getTextWidth(ctaText);
      doc.text(ctaText, (pageWidth - ctaWidth) / 2, footerY + 12);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const contactText = 'Entre em contato: contato@creativeagency.com | (11) 9999-9999';
      const contactWidth = doc.getTextWidth(contactText);
      doc.text(contactText, (pageWidth - contactWidth) / 2, footerY + 20);

      doc.setFontSize(8);
      const footerText = 'Esta proposta foi gerada automaticamente pelo Sistema de Gestão Criativa';
      const footerWidth = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - footerWidth) / 2, footerY + 28);

      // ========== SALVAR PDF ==========
      const nomeArquivo = `Proposta_${cliente.empresa.replace(/\s+/g, '_')}_${dataAtual.replace(/\//g, '-')}.pdf`;
      doc.save(nomeArquivo);

      // Gerar ID do documento para salvar no cliente
      const documentoId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setPropostaGerada(true);
      setTimeout(() => {
        onPropostaGerada(documentoId, nomeArquivo);
        setGerando(false);
      }, 1000);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar proposta. Tente novamente.');
      setGerando(false);
    }
  };

  const handleClose = () => {
    if (!gerando) {
      setPropostaGerada(false);
      setValidade(30);
      setCondicoesPagamento('30/60/90 dias');
      setInicioEstimado('');
      setPrazoEntrega('');
      setGarantia('90 dias');
      onClose();
    }
  };

  if (!isOpen) return null;

  const servicosArray = servicos || [];
  const servicosRecorrentes = servicosArray.filter(s => s.recorrente);
  const valorRecorrente = servicosRecorrentes.reduce((acc, s) => acc + s.valor, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Gerar Proposta Comercial</h2>
                <p className="text-green-100">Cliente: {cliente.empresa}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={gerando}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {propostaGerada ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Proposta Gerada com Sucesso!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                O PDF foi baixado e salvo nos documentos do cliente. Você pode fechar esta janela.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo dos Serviços */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Resumo da Proposta
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total de Serviços</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{servicosArray.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {valorRecorrente > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valor Mensal Recorrente</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      R$ {valorRecorrente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>

              {/* Serviços Incluídos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Serviços Incluídos
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {servicosArray.map((servico, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{servico.nome}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{servico.descricao}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          R$ {servico.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {servico.recorrente && (
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            /{servico.unidade}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Condições Comerciais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Validade da Proposta (dias)
                  </label>
                  <input
                    type="number"
                    value={validade}
                    onChange={(e) => setValidade(Number(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condições de Pagamento
                  </label>
                  <select
                    value={condicoesPagamento}
                    onChange={(e) => setCondicoesPagamento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="À vista">À vista</option>
                    <option value="30 dias">30 dias</option>
                    <option value="30/60 dias">30/60 dias</option>
                    <option value="30/60/90 dias">30/60/90 dias</option>
                    <option value="Parcelado em 6x">Parcelado em 6x</option>
                    <option value="Parcelado em 12x">Parcelado em 12x</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Início Estimado
                  </label>
                  <input
                    type="text"
                    value={inicioEstimado}
                    onChange={(e) => setInicioEstimado(e.target.value)}
                    placeholder="Ex: Imediato, 15 dias, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prazo de Entrega
                  </label>
                  <input
                    type="text"
                    value={prazoEntrega}
                    onChange={(e) => setPrazoEntrega(e.target.value)}
                    placeholder="Ex: 30 dias, 60 dias, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Garantia
                  </label>
                  <input
                    type="text"
                    value={garantia}
                    onChange={(e) => setGarantia(e.target.value)}
                    placeholder="Ex: 90 dias, 6 meses, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Observações */}
              {observacoes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observações que serão incluídas
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {observacoes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!propostaGerada && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <button
                onClick={handleClose}
                disabled={gerando}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={gerarPDF}
                disabled={gerando}
                className="px-8 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {gerando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Gerar e Baixar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalGerarProposta;
