import React, { useState } from 'react';
import './App.css';
import logo from './assets/logo_marido_aluguel_3.png';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import QuoteRequest from './components/QuoteRequest';
import QuotesList from './components/QuotesList';
import {
  Hammer,
  Wrench,
  Zap,
  Droplets,
  PaintBucket,
  Home,
  Star,
  MessageCircle,
  Calendar,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Monitor,
  Cctv,
  ArrowLeft,
  Printer,
  Laptop,
  GraduationCap,
  Palette,
  Camera,
  Shield,
  Settings,
  Lightbulb,
  Wrench as WrenchIcon,
  Brush
} from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('welcome');
  const [userType, setUserType] = useState('cliente');
  const [selectedService, setSelectedService] = useState(null);

  const services = [
    { 
      icon: Hammer, 
      name: 'Montagem de Móveis', 
      color: 'text-red-600',
      id: 'montagem',
      subServices: [
        { icon: Hammer, name: 'Montagem de Guarda-roupa', id: 'montagem-guarda-roupa' },
        { icon: Hammer, name: 'Montagem de Cama', id: 'montagem-cama' },
        { icon: Hammer, name: 'Montagem de Mesa', id: 'montagem-mesa' },
        { icon: Hammer, name: 'Montagem de Estante', id: 'montagem-estante' }
      ]
    },
    { 
      icon: Wrench, 
      name: 'Reparos Gerais', 
      color: 'text-blue-600',
      id: 'reparos',
      subServices: [
        { icon: WrenchIcon, name: 'Reparo de Porta', id: 'reparo-porta' },
        { icon: WrenchIcon, name: 'Reparo de Janela', id: 'reparo-janela' },
        { icon: WrenchIcon, name: 'Reparo de Fechadura', id: 'reparo-fechadura' },
        { icon: WrenchIcon, name: 'Reparo de Móveis', id: 'reparo-moveis' }
      ]
    },
    { 
      icon: Zap, 
      name: 'Elétrica', 
      color: 'text-yellow-600',
      id: 'eletrica',
      subServices: [
        { icon: Lightbulb, name: 'Instalação de Lâmpada', id: 'instalacao-lampada' },
        { icon: Zap, name: 'Instalação de Tomada', id: 'instalacao-tomada' },
        { icon: Zap, name: 'Reparo de Chuveiro Elétrico', id: 'reparo-chuveiro' },
        { icon: Zap, name: 'Instalação de Ventilador', id: 'instalacao-ventilador' }
      ]
    },
    { 
      icon: Droplets, 
      name: 'Hidráulica', 
      color: 'text-blue-400',
      id: 'hidraulica',
      subServices: [
        { icon: Droplets, name: 'Reparo de Torneira', id: 'reparo-torneira' },
        { icon: Droplets, name: 'Desentupimento', id: 'desentupimento' },
        { icon: Droplets, name: 'Instalação de Chuveiro', id: 'instalacao-chuveiro' },
        { icon: Droplets, name: 'Reparo de Vaso Sanitário', id: 'reparo-vaso' }
      ]
    },
    { 
      icon: PaintBucket, 
      name: 'Pintura', 
      color: 'text-green-600',
      id: 'pintura',
      subServices: [
        { icon: Brush, name: 'Pintura de Parede', id: 'pintura-parede' },
        { icon: Brush, name: 'Pintura de Portão', id: 'pintura-portao' },
        { icon: Brush, name: 'Pintura de Móveis', id: 'pintura-moveis' },
        { icon: Brush, name: 'Retoque de Tinta', id: 'retoque-tinta' }
      ]
    },
    { 
      icon: Home, 
      name: 'Manutenção Geral', 
      color: 'text-gray-600',
      id: 'manutencao',
      subServices: [
        { icon: Home, name: 'Limpeza Geral', id: 'limpeza-geral' },
        { icon: Home, name: 'Organização', id: 'organizacao' },
        { icon: Home, name: 'Pequenos Reparos', id: 'pequenos-reparos' },
        { icon: Home, name: 'Manutenção Preventiva', id: 'manutencao-preventiva' }
      ]
    },
    { 
      icon: Monitor, 
      name: 'Informática', 
      color: 'text-purple-600',
      id: 'informatica',
      subServices: [
        { icon: Printer, name: 'Limpeza de Impressora', id: 'limpeza-impressora' },
        { icon: Laptop, name: 'Manutenção de PC/Notebook', id: 'manutencao-pc' },
        { icon: GraduationCap, name: 'Aula de Informática', id: 'aula-informatica' },
        { icon: Palette, name: 'Aula de Designer', id: 'aula-designer' }
      ]
    },
    { 
      icon: Cctv, 
      name: 'CFTV', 
      color: 'text-orange-600',
      id: 'cftv',
      subServices: [
        { icon: Camera, name: 'Instalação de Câmeras', id: 'instalacao-cameras' },
        { icon: Monitor, name: 'Configuração de Sistema', id: 'configuracao-sistema' },
        { icon: Shield, name: 'Manutenção de CFTV', id: 'manutencao-cftv' },
        { icon: Settings, name: 'Monitoramento Remoto', id: 'monitoramento-remoto' }
      ]
    }
  ];

  const prestadores = [
    {
      id: 1,
      nome: 'João Silva',
      rating: 4.8,
      servicos: ['Elétrica', 'Hidráulica', 'Manutenção de PC/Notebook'],
      preco: 'R$ 50/hora',
      avaliacoes: 127
    },
    {
      id: 2,
      nome: 'Carlos Santos',
      rating: 4.9,
      servicos: ['Montagem', 'Reparos', 'Limpeza de Impressora'],
      preco: 'R$ 45/hora',
      avaliacoes: 89
    },
    {
      id: 3,
      nome: 'Pedro Oliveira',
      rating: 4.7,
      servicos: ['Pintura', 'Manutenção', 'Instalação de CFTV'],
      preco: 'R$ 40/hora',
      avaliacoes: 156
    }
  ];

  // Componente para seleção de sub-serviços
  const SubServiceSelection = ({ service, onBack, onSelectSubService }) => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <img src={logo} alt="Marido de Aluguel" className="w-10 h-10 mr-3" />
              <h1 className="text-xl font-bold text-blue-900">{service.name}</h1>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-8">
            <service.icon className={`w-16 h-16 mx-auto mb-4 ${service.color}`} />
            <h2 className="text-2xl font-bold mb-2">Qual tipo de {service.name.toLowerCase()}?</h2>
            <p className="text-gray-600">Selecione o serviço específico que você precisa</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {service.subServices.map((subService, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                onClick={() => onSelectSubService(subService)}
              >
                <CardContent className="p-6 text-center">
                  <subService.icon className={`w-12 h-12 mx-auto mb-3 ${service.color}`} />
                  <p className="font-medium text-sm">{subService.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Componente para tela de mensagens
  const MessagesScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('dashboard')}
                className="mr-4"
              >
                ← Voltar ao Dashboard
              </Button>
              <img src={logo} alt="Marido de Aluguel" className="w-10 h-10 mr-3" />
              <h1 className="text-xl font-bold text-blue-900">Mensagens</h1>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Suas Conversas</h2>
          <div className="space-y-4">
            {prestadores.map((prestador) => (
              <div key={prestador.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{prestador.nome}</h3>
                      <p className="text-sm text-gray-600">Última mensagem há 2 horas</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Nova</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Componente para tela de perfil
  const ProfileScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('dashboard')}
                className="mr-4"
              >
                ← Voltar ao Dashboard
              </Button>
              <img src={logo} alt="Marido de Aluguel" className="w-10 h-10 mr-3" />
              <h1 className="text-xl font-bold text-blue-900">Meu Perfil</h1>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mr-6">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Maria Silva</h2>
              <p className="text-gray-600">Cliente desde 2024</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span>maria.silva@email.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <span>(11) 99999-9999</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <span>São Paulo, SP</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Serviços contratados:</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span>Avaliação média:</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold">4.9</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Economia total:</span>
                  <span className="font-semibold text-green-600">R$ 2.450</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <Button className="bg-red-600 hover:bg-red-700 mr-4">
              Editar Perfil
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('welcome')}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente para busca de emergência
  const EmergencyScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('dashboard')}
                className="mr-4"
              >
                ← Voltar ao Dashboard
              </Button>
              <img src={logo} alt="Marido de Aluguel" className="w-10 h-10 mr-3" />
              <h1 className="text-xl font-bold text-blue-900">Emergência</h1>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-8">
            <MapPin className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Atendimento de Emergência</h2>
            <p className="text-gray-600">Profissionais disponíveis agora na sua região</p>
          </div>
          
          <div className="space-y-4">
            {prestadores.map((prestador) => (
              <Card key={prestador.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{prestador.nome}</h3>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm">{prestador.rating}</span>
                          <span className="text-sm text-gray-600 ml-2">Disponível agora</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{prestador.preco}</p>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 mt-2">
                        Chamar Agora
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const WelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-red-600 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-md w-full">
        <img src={logo} alt="Marido de Aluguel" className="w-32 h-32 mx-auto mb-8" />
        <h1 className="text-4xl font-bold mb-4">Marido de Aluguel</h1>
        <p className="text-xl mb-8 opacity-90">
          Conectamos você aos melhores profissionais para resolver seus problemas domésticos
        </p>
        
        <div className="space-y-4 mb-8">
          <Button 
            onClick={() => setCurrentView('login')}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg"
          >
            Entrar
          </Button>
          <Button 
            onClick={() => setCurrentView('register')}
            variant="outline" 
            className="w-full border-white text-white hover:bg-white hover:text-blue-900 py-3 text-lg"
          >
            Cadastrar-se
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          {services.slice(0, 8).map((service, index) => (
            <div key={index} className="opacity-80">
              <service.icon className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">{service.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const LoginScreen = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="Marido de Aluguel" className="w-20 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl text-blue-900">Entrar</CardTitle>
          <CardDescription>Acesse sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button 
            onClick={() => setCurrentView('dashboard')}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Entrar
          </Button>
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Não tem conta?{' '}
              <button 
                onClick={() => setCurrentView('register')}
                className="text-red-600 hover:underline"
              >
                Cadastre-se
              </button>
            </p>
            <button className="text-sm text-blue-600 hover:underline">
              Esqueci minha senha
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const RegisterScreen = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="Marido de Aluguel" className="w-20 h-20 mx-auto mb-4" />
          <CardTitle className="text-2xl text-blue-900">Cadastrar-se</CardTitle>
          <CardDescription>Crie sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={userType} onValueChange={setUserType} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="prestador">Prestador</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cliente" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" placeholder="Seu nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
            </TabsContent>
            
            <TabsContent value="prestador" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" placeholder="Seu nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servicos">Serviços Oferecidos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((service, index) => (
                    <Badge key={index} variant="outline" className="justify-center p-2 cursor-pointer hover:bg-blue-50">
                      <service.icon className="w-4 h-4 mr-1" />
                      {service.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
            </TabsContent>
          </Tabs>
          
          <Button 
            onClick={() => setCurrentView('dashboard')}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Cadastrar
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem conta?{' '}
              <button 
                onClick={() => setCurrentView('login')}
                className="text-red-600 hover:underline"
              >
                Entrar
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const DashboardScreen = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logo} alt="Marido de Aluguel" className="w-10 h-10 mr-3" />
              <h1 className="text-xl font-bold text-blue-900 hidden sm:block">Marido de Aluguel</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentView('quotes-list')}
                className="text-xs sm:text-sm"
              >
                <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Meus Orçamentos</span>
                <span className="sm:hidden">Orçamentos</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentView('messages')}
                className="text-xs sm:text-sm"
              >
                <MessageCircle className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Mensagens</span>
                <span className="sm:hidden">Chat</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setCurrentView('profile')}
                className="text-xs sm:text-sm"
              >
                <User className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Perfil</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              placeholder="Buscar serviços (ex: eletricista, encanador, pintor...)"
              className="pl-10 py-3 text-base sm:text-lg"
            />
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Serviços Disponíveis</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {services.map((service, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedService(service);
                  setCurrentView('sub-service-selection');
                }}
              >
                <CardContent className="p-4 sm:p-6 text-center">
                  <service.icon className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 ${service.color}`} />
                  <p className="font-medium text-xs sm:text-sm">{service.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Providers */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Prestadores em Destaque</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {prestadores.map((prestador) => (
              <Card key={prestador.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{prestador.nome}</h3>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-600">
                          {prestador.rating} ({prestador.avaliacoes})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {prestador.servicos.map((servico, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{servico}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-600 text-sm sm:text-base">{prestador.preco}</span>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setCurrentView('messages')}
                        className="text-xs"
                      >
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Chat
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700 text-xs"
                        onClick={() => setCurrentView('quote-request')}
                      >
                        Contratar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                Solicitar Orçamento
              </CardTitle>
              <CardDescription className="text-sm">
                Descreva seu problema e receba orçamentos de profissionais qualificados
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={() => setCurrentView('quote-request')}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Criar Solicitação
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                Emergência
              </CardTitle>
              <CardDescription className="text-sm">
                Precisa de atendimento urgente? Encontre profissionais disponíveis agora
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                className="w-full border-red-600 text-red-600 hover:bg-red-50"
                onClick={() => setCurrentView('emergency')}
              >
                Buscar Emergência
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'login':
        return <LoginScreen />;
      case 'register':
        return <RegisterScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'sub-service-selection':
        return (
          <SubServiceSelection 
            service={selectedService}
            onBack={() => setCurrentView('dashboard')}
            onSelectSubService={(subService) => {
              setCurrentView('quote-request');
            }}
          />
        );
      case 'quote-request':
        return <QuoteRequest onBack={() => setCurrentView('dashboard')} />;
      case 'quotes-list':
        return <QuotesList onBack={() => setCurrentView('dashboard')} />;
      case 'messages':
        return <MessagesScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'emergency':
        return <EmergencyScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return renderCurrentView();
}

export default App;

