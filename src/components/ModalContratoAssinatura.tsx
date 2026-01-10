import React, { useState, useRef } from 'react';
import { X, FileSignature, Check, Eraser, Download, AlertCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';

interface ServicoContratado {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  recorrente: boolean;
  unidade: string;
}

interface ModalContratoAssinaturaProps {
  isOpen: boolean;
  onClose: () => void;
  contratoId?: string;
  cliente: {
    nome: string;
    empresa: string;
    email: string;
    telefone: string;
    cpf?: string;
    cnpj?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
  };
  servicos: ServicoContratado[];
  valorTotal: number;
  onContratoAssinado: (contratoId: string, assinaturaBase64: string, nomeArquivo: string, pdfBase64: string) => void;
}

const ModalContratoAssinatura: React.FC<ModalContratoAssinaturaProps> = ({
  isOpen,
  onClose,
  contratoId,
  cliente,
  servicos,
  valorTotal,
  onContratoAssinado
}) => {
  // Guard: validar dados necessários
  const servicosArray = servicos || [];
  if (!isOpen || !cliente) return null;

  const sigCanvas = useRef<SignatureCanvas>(null);
  const [assinado, setAssinado] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [aceitoTermos, setAceitoTermos] = useState(false);
  const [assinaturaVazia, setAssinaturaVazia] = useState(true);

  const limparAssinatura = () => {
    sigCanvas.current?.clear();
    setAssinaturaVazia(true);
  };

  const handleAssinatura = () => {
    if (sigCanvas.current?.isEmpty()) {
      setAssinaturaVazia(true);
    } else {
      setAssinaturaVazia(false);
    }
  };

  const gerarContratoComAssinatura = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert('Por favor, assine o contrato antes de confirmar.');
      return;
    }

    if (!aceitoTermos) {
      alert('Por favor, aceite os termos e condições do contrato.');
      return;
    }

    setProcessando(true);

    try {
      // Capturar assinatura como base64
      const assinaturaBase64 = sigCanvas.current.toDataURL();

      // Use o ID existente do contrato quando fornecido; evita divergência com o estado
      const contratoIdFinal = contratoId || `CONT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Criar PDF do contrato
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPos = 20;

      // ========== HEADER DO CONTRATO ==========
      doc.setFillColor(30, 64, 175); // blue-800
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Creative Agency - Soluções Criativas', pageWidth / 2, 25, { align: 'center' });

      yPos = 45;

      // ========== NÚMERO DO CONTRATO E DATA ==========
      const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'bold');
      doc.text(`Contrato Nº: ${contratoIdFinal}`, margin, yPos);
      doc.text(`Data: ${dataAtual}`, pageWidth - margin, yPos, { align: 'right' });

      yPos += 15;

      // ========== PARTES DO CONTRATO ==========
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('DAS PARTES', margin, yPos);

      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATANTE:', margin, yPos);
      
      doc.setFont('helvetica', 'normal');
      yPos += 6;
      doc.text(`Nome/Razão Social: ${cliente.empresa}`, margin + 5, yPos);
      yPos += 5;
      doc.text(`Representante: ${cliente.nome}`, margin + 5, yPos);
      yPos += 5;
      if (cliente.cpf) doc.text(`CPF: ${cliente.cpf}`, margin + 5, yPos);
      if (cliente.cnpj) doc.text(`CNPJ: ${cliente.cnpj}`, margin + 5, yPos);
      yPos += 5;
      doc.text(`E-mail: ${cliente.email}`, margin + 5, yPos);
      yPos += 5;
      doc.text(`Telefone: ${cliente.telefone}`, margin + 5, yPos);
      
      if (cliente.endereco) {
        yPos += 5;
        const enderecoCompleto = `${cliente.endereco}${cliente.cidade ? ', ' + cliente.cidade : ''}${cliente.estado ? ' - ' + cliente.estado : ''}`;
        doc.text(`Endereço: ${enderecoCompleto}`, margin + 5, yPos);
      }

      yPos += 10;

      doc.setFont('helvetica', 'bold');
      doc.text('CONTRATADA:', margin, yPos);
      
      doc.setFont('helvetica', 'normal');
      yPos += 6;
      doc.text('Razão Social: Creative Agency LTDA', margin + 5, yPos);
      yPos += 5;
      doc.text('CNPJ: 12.345.678/0001-90', margin + 5, yPos);
      yPos += 5;
      doc.text('E-mail: contato@creativeagency.com', margin + 5, yPos);
      yPos += 5;
      doc.text('Telefone: (11) 9999-9999', margin + 5, yPos);

      yPos += 15;

      // ========== OBJETO DO CONTRATO ==========
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CLÁUSULA PRIMEIRA - DO OBJETO', margin, yPos);

      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const textoObjeto = 'O presente contrato tem por objeto a prestação de serviços de comunicação, marketing e design pela CONTRATADA para a CONTRATANTE, conforme especificado abaixo:';
      const linhasObjeto = doc.splitTextToSize(textoObjeto, pageWidth - 2 * margin);
      doc.text(linhasObjeto, margin, yPos);
      yPos += linhasObjeto.length * 5 + 5;

      // Lista de serviços
      servicosArray.forEach((servico, index) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${servico.nome} - ${servico.categoria}`, margin + 5, yPos);
        yPos += 5;
        const valorText = servico.recorrente 
          ? `   Valor: R$ ${servico.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/${servico.unidade}`
          : `   Valor: R$ ${servico.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        doc.text(valorText, margin + 5, yPos);
        yPos += 7;
      });

      yPos += 5;

      // ========== VALOR TOTAL ==========
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 12, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('VALOR TOTAL DOS SERVIÇOS:', margin + 5, yPos + 5);
      doc.text(`R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, yPos + 5, { align: 'right' });

      yPos += 20;

      // ========== CLÁUSULA SEGUNDA - PAGAMENTO ==========
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CLÁUSULA SEGUNDA - DO PAGAMENTO', margin, yPos);

      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const textoPagamento = 'O pagamento será realizado conforme as condições estabelecidas na proposta comercial aceita pela CONTRATANTE. Para serviços recorrentes, o pagamento será mensal, com vencimento no dia 10 de cada mês. Atrasos superiores a 15 dias poderão resultar na suspensão dos serviços.';
      const linhasPagamento = doc.splitTextToSize(textoPagamento, pageWidth - 2 * margin);
      doc.text(linhasPagamento, margin, yPos);
      yPos += linhasPagamento.length * 5 + 10;

      // ========== CLÁUSULA TERCEIRA - PRAZO E VIGÊNCIA ==========
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CLÁUSULA TERCEIRA - DO PRAZO E VIGÊNCIA', margin, yPos);

      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const textoVigencia = 'O presente contrato terá vigência a partir da data de sua assinatura. Para serviços pontuais, o prazo de entrega será conforme estabelecido na proposta. Para serviços recorrentes, o contrato terá vigência indeterminada, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 dias.';
      const linhasVigencia = doc.splitTextToSize(textoVigencia, pageWidth - 2 * margin);
      doc.text(linhasVigencia, margin, yPos);
      yPos += linhasVigencia.length * 5 + 10;

      // ========== CLÁUSULA QUARTA - OBRIGAÇÕES ==========
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CLÁUSULA QUARTA - DAS OBRIGAÇÕES', margin, yPos);

      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.setFont('helvetica', 'bold');
      doc.text('Da CONTRATADA:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 6;
      
      const obrigacoesContratada = [
        '• Executar os serviços com qualidade e profissionalismo;',
        '• Entregar os trabalhos nos prazos estabelecidos;',
        '• Manter sigilo sobre informações confidenciais;',
        '• Fornecer suporte técnico conforme acordado.'
      ];
      
      obrigacoesContratada.forEach(obr => {
        doc.text(obr, margin + 5, yPos);
        yPos += 5;
      });

      yPos += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Da CONTRATANTE:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 6;
      
      const obrigacoesContratante = [
        '• Efetuar os pagamentos nos prazos acordados;',
        '• Fornecer informações e materiais necessários;',
        '• Aprovar ou reprovar materiais em até 5 dias úteis;',
        '• Respeitar os direitos autorais dos trabalhos.'
      ];
      
      obrigacoesContratante.forEach(obr => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(obr, margin + 5, yPos);
        yPos += 5;
      });

      yPos += 10;

      // ========== CLÁUSULA QUINTA - RESCISÃO ==========
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CLÁUSULA QUINTA - DA RESCISÃO', margin, yPos);

      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const textoRescisao = 'O presente contrato poderá ser rescindido por qualquer das partes mediante comunicação prévia de 30 dias. Em caso de inadimplência superior a 30 dias, a CONTRATADA poderá rescindir o contrato imediatamente, sem prejuízo da cobrança dos valores devidos.';
      const linhasRescisao = doc.splitTextToSize(textoRescisao, pageWidth - 2 * margin);
      doc.text(linhasRescisao, margin, yPos);
      yPos += linhasRescisao.length * 5 + 10;

      // ========== CLÁUSULA SEXTA - FORO ==========
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CLÁUSULA SEXTA - DO FORO', margin, yPos);

      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const textoForo = 'Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.';
      const linhasForo = doc.splitTextToSize(textoForo, pageWidth - 2 * margin);
      doc.text(linhasForo, margin, yPos);
      yPos += linhasForo.length * 5 + 15;

      // ========== ÁREA DE ASSINATURA ==========
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);

      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('E por estarem assim justas e contratadas, as partes assinam o presente contrato.', margin, yPos);

      yPos += 15;

      // Data e local
      doc.setFont('helvetica', 'italic');
      doc.text(`São Paulo, ${dataAtual}`, pageWidth / 2, yPos, { align: 'center' });

      yPos += 20;

      // ========== ASSINATURA DO CLIENTE (DIGITAL) ==========
      // Adicionar imagem da assinatura
      const assinaturaImg = sigCanvas.current.toDataURL('image/png');
      const imgWidth = 60;
      const imgHeight = 20;
      
      doc.addImage(assinaturaImg, 'PNG', margin + 10, yPos, imgWidth, imgHeight);

      yPos += imgHeight + 3;

      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPos, margin + 80, yPos);

      yPos += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(cliente.nome, margin, yPos);
      yPos += 4;
      doc.setFont('helvetica', 'normal');
      doc.text(`${cliente.empresa} - CONTRATANTE`, margin, yPos);
      if (cliente.cpf) {
        yPos += 4;
        doc.text(`CPF: ${cliente.cpf}`, margin, yPos);
      }
      if (cliente.cnpj) {
        yPos += 4;
        doc.text(`CNPJ: ${cliente.cnpj}`, margin, yPos);
      }

      // ========== ASSINATURA DA EMPRESA ==========
      const yPosEmpresa = yPos - imgHeight - 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('[Assinatura Digital]', pageWidth - margin - 80 + 10, yPosEmpresa + 10);

      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(pageWidth - margin - 80, yPosEmpresa + imgHeight + 3, pageWidth - margin, yPosEmpresa + imgHeight + 3);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('João Silva', pageWidth - margin - 80, yPosEmpresa + imgHeight + 8);
      doc.setFont('helvetica', 'normal');
      doc.text('Creative Agency LTDA - CONTRATADA', pageWidth - margin - 80, yPosEmpresa + imgHeight + 12);
      doc.text('CNPJ: 12.345.678/0001-90', pageWidth - margin - 80, yPosEmpresa + imgHeight + 16);

      // ========== RODAPÉ COM INFORMAÇÕES DE AUTENTICIDADE ==========
      const footerY = pageHeight - 25;
      
      doc.setFillColor(245, 245, 245);
      doc.rect(0, footerY, pageWidth, 25, 'F');

      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      doc.text('Este contrato foi assinado digitalmente e possui validade jurídica conforme MP 2.200-2/2001', pageWidth / 2, footerY + 8, { align: 'center' });
      doc.text(`Código de verificação: ${contratoId} | Assinado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, footerY + 13, { align: 'center' });
      doc.text('Hash de autenticidade: ' + btoa(contratoIdFinal + cliente.email).substr(0, 32), pageWidth / 2, footerY + 18, { align: 'center' });

      // ========== SALVAR PDF ==========
      const nomeArquivo = `Contrato_${cliente.empresa.replace(/\s+/g, '_')}_${contratoIdFinal}.pdf`;
      
      // Obter PDF como base64 para upload
      const pdfBase64 = doc.output('datauristring');
      
      // Baixar localmente também
      doc.save(nomeArquivo);

      // Aguardar um pouco e então confirmar
      setTimeout(() => {
        setAssinado(true);
        setProcessando(false);
        
        setTimeout(() => {
          onContratoAssinado(contratoIdFinal, assinaturaBase64, nomeArquivo, pdfBase64);
        }, 1500);
      }, 1000);

    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      alert('Erro ao gerar contrato. Tente novamente.');
      setProcessando(false);
    }
  };

  const handleClose = () => {
    if (!processando) {
      limparAssinatura();
      setAssinado(false);
      setAceitoTermos(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <FileSignature className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Contrato de Prestação de Serviços</h2>
                <p className="text-purple-100">Assinatura Digital - {cliente.empresa}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={processando}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {assinado ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full">
                <Check className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Contrato Assinado com Sucesso!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                O contrato foi gerado e assinado digitalmente. O PDF foi baixado e os dados foram salvos no sistema.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Cliente:</strong> {cliente.empresa}<br />
                  <strong>Serviços:</strong> {servicosArray.length} contratados<br />
                  <strong>Valor Total:</strong> R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informações do Contrato */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Resumo do Contrato
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Contratante</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{cliente.nome}</p>
                    <p className="text-gray-700 dark:text-gray-300">{cliente.empresa}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Contratada</p>
                    <p className="font-semibold text-gray-900 dark:text-white">Creative Agency LTDA</p>
                    <p className="text-gray-700 dark:text-gray-300">CNPJ: 12.345.678/0001-90</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Serviços Contratados</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{servicosArray.length} serviços</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Valor Total</p>
                    <p className="font-semibold text-2xl text-purple-600 dark:text-purple-400">
                      R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Serviços */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Serviços Inclusos no Contrato
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {servicosArray.map((servico, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{servico.nome}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{servico.categoria}</p>
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

              {/* Termos e Condições */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Termos e Condições Importantes
                    </h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• O contrato terá vigência a partir da data de assinatura</li>
                      <li>• Serviços recorrentes serão cobrados mensalmente</li>
                      <li>• Prazo de entrega conforme estabelecido na proposta</li>
                      <li>• Rescisão com aviso prévio de 30 dias</li>
                      <li>• Garantia de 90 dias para correções e ajustes</li>
                      <li>• Pagamento conforme condições da proposta aceita</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Área de Assinatura */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />
                  Assinatura Digital do Contratante
                </h3>
                
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900">
                  <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                    <SignatureCanvas
                      ref={sigCanvas}
                      canvasProps={{
                        className: 'w-full h-48 cursor-crosshair',
                        style: { touchAction: 'none' }
                      }}
                      onEnd={handleAssinatura}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Assine dentro do campo acima usando mouse ou touch
                    </p>
                    <button
                      onClick={limparAssinatura}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Eraser className="w-4 h-4" />
                      Limpar
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkbox de Aceite */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input
                  type="checkbox"
                  id="aceite-termos"
                  checked={aceitoTermos}
                  onChange={(e) => setAceitoTermos(e.target.checked)}
                  className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <label htmlFor="aceite-termos" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Declaro que li e concordo com todos os termos e condições deste contrato, e confirmo que minha assinatura digital acima possui validade jurídica conforme a Medida Provisória 2.200-2/2001.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!assinado && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <button
                onClick={handleClose}
                disabled={processando}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={gerarContratoComAssinatura}
                disabled={processando || assinaturaVazia || !aceitoTermos}
                className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {processando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gerando Contrato...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Assinar e Baixar Contrato
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

export default ModalContratoAssinatura;
