import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  ArrowLeft,
  Upload,
  MapPin,
  Calendar,
  Clock,
  Hammer, 
  Wrench, 
  Zap, 
  Droplets, 
  PaintBucket, 
  Home,
  Monitor,
  Cctv
} from 'lucide-react';

const QuoteRequest = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: '',
    description: '',
    address: '',
    date: '',
    time: '',
    urgency: 'normal',
    photos: []
  });

  const services = [
    { icon: Hammer, name: 'Montagem de Móveis', id: 'montagem' },
    { icon: Wrench, name: 'Reparos Gerais', id: 'reparos' },
    { icon: Zap, name: 'Elétrica', id: 'eletrica' },
    { icon: Droplets, name: 'Hidráulica', id: 'hidraulica' },
    { icon: PaintBucket, name: 'Pintura', id: 'pintura' },
    { icon: Home, name: 'Manutenção Geral', id: 'manutencao' },
    { icon: Monitor, name: 'Informática', id: 'informatica' },
    { icon: Cctv, name: 'CFTV', id: 'cftv' }
  ];

  const handleServiceSelect = (serviceId) => {
    setFormData({ ...formData, serviceType: serviceId });
    setStep(2);
  };

  const handleSubmit = () => {
    // Aqui seria enviado para o backend
    console.log('Solicitação de orçamento:', formData);
    alert('Solicitação enviada com sucesso! Você receberá orçamentos em breve.');
    onBack();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual serviço você precisa?</h2>
        <p className="text-gray-600">Selecione o tipo de serviço que você está procurando</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card 
            key={service.id} 
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-red-300"
            onClick={() => handleServiceSelect(service.id)}
          >
            <CardContent className="p-6 text-center">
              <service.icon className="w-12 h-12 mx-auto mb-3 text-red-600" />
              <p className="font-medium text-sm">{service.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Descreva seu problema</h2>
        <p className="text-gray-600">Quanto mais detalhes, melhor será o orçamento</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="description">Descrição do problema</Label>
          <Textarea
            id="description"
            placeholder="Descreva detalhadamente o que precisa ser feito..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="address">Endereço</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="address"
              placeholder="Rua, número, bairro, cidade..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Data preferencial</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="time">Horário preferencial</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Urgência</Label>
          <div className="flex gap-2 mt-2">
            <Badge 
              variant={formData.urgency === 'normal' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFormData({ ...formData, urgency: 'normal' })}
            >
              Normal
            </Badge>
            <Badge 
              variant={formData.urgency === 'urgente' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFormData({ ...formData, urgency: 'urgente' })}
            >
              Urgente
            </Badge>
            <Badge 
              variant={formData.urgency === 'emergencia' ? 'default' : 'outline'}
              className="cursor-pointer bg-red-600 text-white"
              onClick={() => setFormData({ ...formData, urgency: 'emergencia' })}
            >
              Emergência
            </Badge>
          </div>
        </div>

        <div>
          <Label>Fotos (opcional)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">Clique para adicionar fotos do problema</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB cada</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => setStep(1)}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={handleSubmit}
          className="flex-1 bg-red-600 hover:bg-red-700"
          disabled={!formData.description || !formData.address}
        >
          Enviar Solicitação
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitar Orçamento</CardTitle>
            <CardDescription>
              Passo {step} de 2 - {step === 1 ? 'Selecione o serviço' : 'Detalhes da solicitação'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? renderStep1() : renderStep2()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuoteRequest;

