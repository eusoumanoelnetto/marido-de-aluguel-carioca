import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  ArrowLeft,
  Star,
  MessageCircle,
  User,
  Clock,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';

const QuotesList = ({ onBack }) => {
  const [quotes] = useState([
    {
      id: 1,
      prestador: {
        nome: 'João Silva',
        rating: 4.8,
        avaliacoes: 127,
        foto: null
      },
      valor: 150,
      prazo: '2 dias',
      descricao: 'Instalação completa do chuveiro elétrico, incluindo fiação nova e disjuntor. Materiais inclusos no orçamento.',
      servicos: ['Elétrica', 'Hidráulica'],
      dataEnvio: '2025-08-12',
      status: 'pendente'
    },
    {
      id: 2,
      prestador: {
        nome: 'Carlos Santos',
        rating: 4.9,
        avaliacoes: 89,
        foto: null
      },
      valor: 120,
      prazo: '1 dia',
      descricao: 'Troca do chuveiro elétrico com verificação da instalação elétrica existente. Materiais por conta do cliente.',
      servicos: ['Elétrica'],
      dataEnvio: '2025-08-12',
      status: 'pendente'
    },
    {
      id: 3,
      prestador: {
        nome: 'Pedro Oliveira',
        rating: 4.7,
        avaliacoes: 156,
        foto: null
      },
      valor: 180,
      prazo: '3 dias',
      descricao: 'Serviço completo incluindo nova fiação, disjuntor, chuveiro premium e garantia de 1 ano.',
      servicos: ['Elétrica', 'Hidráulica'],
      dataEnvio: '2025-08-11',
      status: 'pendente'
    }
  ]);

  const [selectedQuote, setSelectedQuote] = useState(null);

  const handleAcceptQuote = (quoteId) => {
    alert(`Orçamento aceito! O prestador será notificado e entrará em contato para agendar o serviço.`);
    // Aqui seria enviado para o backend
  };

  const handleRejectQuote = (quoteId) => {
    alert(`Orçamento recusado.`);
    // Aqui seria enviado para o backend
  };

  const handleChat = (prestadorNome) => {
    alert(`Abrindo chat com ${prestadorNome}...`);
    // Aqui seria aberto o chat
  };

  if (selectedQuote) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedQuote(null)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Orçamentos
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>{selectedQuote.prestador.nome}</CardTitle>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">
                        {selectedQuote.prestador.rating} ({selectedQuote.prestador.avaliacoes} avaliações)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">R$ {selectedQuote.valor}</div>
                  <div className="text-sm text-gray-600">Prazo: {selectedQuote.prazo}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Serviços Oferecidos</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedQuote.servicos.map((servico, index) => (
                    <Badge key={index} variant="secondary">{servico}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Descrição do Orçamento</h3>
                <p className="text-gray-700">{selectedQuote.descricao}</p>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                Enviado em {new Date(selectedQuote.dataEnvio).toLocaleDateString('pt-BR')}
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => handleChat(selectedQuote.prestador.nome)}
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Conversar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleRejectQuote(selectedQuote.id)}
                  className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Recusar
                </Button>
                <Button 
                  onClick={() => handleAcceptQuote(selectedQuote.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aceitar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h3 className="font-semibold text-blue-900">Solicitação: Instalação de Chuveiro Elétrico</h3>
                <p className="text-sm text-blue-700">Rua das Flores, 123 - Centro, São Paulo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Orçamentos Recebidos</h1>
          <p className="text-gray-600">Você recebeu {quotes.length} orçamentos para sua solicitação</p>
        </div>

        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{quote.prestador.nome}</h3>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-600">
                          {quote.prestador.rating} ({quote.prestador.avaliacoes} avaliações)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">R$ {quote.valor}</div>
                    <div className="text-sm text-gray-600">Prazo: {quote.prazo}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {quote.servicos.map((servico, index) => (
                      <Badge key={index} variant="secondary">{servico}</Badge>
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm line-clamp-2">{quote.descricao}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(quote.dataEnvio).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChat(quote.prestador.nome);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuote(quote);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {quotes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <MessageCircle className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum orçamento ainda</h3>
              <p className="text-gray-600">
                Aguarde! Os prestadores estão analisando sua solicitação e enviarão orçamentos em breve.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuotesList;

