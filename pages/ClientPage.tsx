import React, { useState, useEffect, useMemo } from 'react';
import { ServiceRequest, ServiceCategory, User } from '../types';
import { HammerIcon, WrenchIcon, ZapIcon, DropletsIcon, PaintBucketIcon, HouseIcon, MonitorIcon, CctvIcon } from '../components/Icons';

interface ClientPageProps {
    currentUser: User;
    addServiceRequest: (request: ServiceRequest) => void;
    onLogout: () => void;
    updateUser: (user: User) => void;
    requests: ServiceRequest[];
    updateRequestStatus: (id: string, status: ServiceRequest['status'], quote?: number) => void;
}

type ClientView = 'dashboard' | 'profile' | 'edit-profile' | 'messages' | 'quote-step1' | 'quote-step2' | 'quotes-received' | 'service-category' | 'emergency' | 'help';

const services: { name: ServiceCategory; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { name: 'Montagem de Móveis' as ServiceCategory, icon: HammerIcon },
    { name: 'Reparos Gerais' as ServiceCategory, icon: WrenchIcon },
    { name: 'Elétrica' as ServiceCategory, icon: ZapIcon },
    { name: 'Hidráulica' as ServiceCategory, icon: DropletsIcon },
    { name: 'Pintura' as ServiceCategory, icon: PaintBucketIcon },
    { name: 'Manutenção Geral' as ServiceCategory, icon: HouseIcon },
    { name: 'Informática' as ServiceCategory, icon: MonitorIcon },
    { name: 'CFTV' as ServiceCategory, icon: CctvIcon },
];

const providers: { name: string; rating: string; tags: string[]; price: string; }[] = [];

const PageHeader: React.FC<{ onBack: () => void, title?: string, children?: React.ReactNode }> = ({ onBack, title, children }) => (
    <header className="flex items-center p-4 border-b border-gray-200 mb-8 max-w-[1200px] mx-auto">
        <button onClick={onBack} className="font-semibold text-[#344054] hover:text-black">
            <i className="fa-solid fa-arrow-left mr-2"></i> {title ? title : 'Voltar'}
        </button>
        <div className="flex-grow text-center">
            {children}
        </div>
        <div className="w-24"></div>
    </header>
);

const EditProfileView: React.FC<{ user: User; onSave: (user: User) => void; onCancel: () => void; }> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState(user);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <main className="max-w-[1200px] mx-auto p-5">
            <PageHeader onBack={onCancel} title="Voltar" />
            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <h1 className="text-3xl font-bold mb-6 text-center text-brand-navy">Editar Perfil</h1>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="name" className="block font-semibold mb-2">Nome Completo</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block font-semibold mb-2">E-mail (não pode ser alterado)</label>
                        <input type="email" id="email" name="email" value={formData.email} disabled className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg text-base cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block font-semibold mb-2">Telefone</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    </div>
                    <div>
                        <label htmlFor="cep" className="block font-semibold mb-2">CEP</label>
                        <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100">Cancelar</button>
                        <button type="submit" className="px-6 py-2.5 rounded-lg font-semibold bg-brand-red text-white hover:opacity-90">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </main>
    );
};

const DashboardView: React.FC<{ setView: (view: ClientView) => void, handleServiceClick: (category: ServiceCategory) => void }> = ({ setView, handleServiceClick }) => (
    <div>
        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-2 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('dashboard')}>
                        <img src="https://wngalbve.manus.space/assets/logo_marido_aluguel_3-CqPHQ69B.png" alt="Logo Marido de Aluguel" className="h-12 w-auto" style={{objectFit: 'contain'}} />
                    </div>
                    <nav className="flex items-center gap-4 md:gap-6 text-gray-600 font-medium">
                        <button
                            onClick={() => setView('quotes-received')}
                            className="flex items-center gap-1.5 hover:text-brand-red transition-colors"
                            aria-label="Meus Orçamentos"
                        >
                            <i className="fa-solid fa-file-invoice text-base md:text-lg"></i>
                            <span className="text-xs md:text-sm whitespace-nowrap">Meus Orçamentos</span>
                        </button>
                        <button
                            onClick={() => setView('messages')}
                            className="flex items-center gap-1.5 hover:text-brand-red transition-colors"
                            aria-label="Mensagens"
                        >
                            <i className="fa-regular fa-comments text-base md:text-lg"></i>
                            <span className="text-xs md:text-sm whitespace-nowrap">Mensagens</span>
                        </button>
                        <button
                            onClick={() => setView('profile')}
                            className="flex items-center gap-1.5 hover:text-brand-red transition-colors"
                            aria-label="Perfil"
                        >
                            <i className="fa-regular fa-user text-base md:text-lg"></i>
                            <span className="text-xs md:text-sm whitespace-nowrap">Perfil</span>
                        </button>
                    </nav>
                </div>
            </div>
        </header>
        <main className="max-w-[1200px] mx-auto p-5">
            <input type="search" className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg my-8 text-base" placeholder="🔎 Buscar serviços (ex: eletricista, encanador, pintor...)" />

            <h2 className="text-3xl font-semibold mb-6 text-brand-navy">Serviços Disponíveis</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5 mb-12">
                {services.map(service => {
                    const IconComponent = service.icon;
                    return (
                        <div key={service.name} onClick={() => handleServiceClick(service.name)} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center gap-3 font-semibold text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
                            <div className="text-4xl text-brand-red h-10 w-10 flex items-center justify-center"><IconComponent /></div>
                            <span className="text-sm md:text-base">{service.name}</span>
                        </div>
                    );
                })}
            </div>

            <h2 className="text-2xl font-semibold mb-5 text-brand-navy">Prestadores em Destaque</h2>
            {providers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                    {/* Provider cards would go here */}
                </div>
            ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200 mb-10">
                    <p className="text-gray-500">Nenhum prestador em destaque no momento.</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h3 className="text-xl md:text-2xl font-semibold mb-3 text-brand-navy">Solicitar Orçamento</h3>
                    <p className="text-gray-500 mb-6 text-base leading-relaxed">Descreva seu problema e receba orçamentos de profissionais qualificados.</p>
                    <button onClick={() => setView('quote-step1')} className="px-8 py-3 rounded-lg font-semibold bg-brand-red text-white hover:opacity-90 text-base">Criar Solicitação</button>
                </div>
                 <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h3 className="text-xl md:text-2xl font-semibold mb-3 text-brand-navy">Emergência</h3>
                    <p className="text-gray-500 mb-6 text-base leading-relaxed">Precisa de atendimento urgente? Encontre profissionais disponíveis agora.</p>
                    <button onClick={() => setView('emergency')} className="px-8 py-3 rounded-lg font-semibold text-brand-red border border-brand-red hover:bg-brand-red/10 text-base">Buscar Emergência</button>
                </div>
            </div>
        </main>
    </div>
);

const ProfileView: React.FC<{ setView: (view: ClientView) => void; onLogout: () => void; user: User; onEdit: () => void; updateUser: (user: User) => void; }> = ({ setView, onLogout, user, onEdit, updateUser }) => {
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64String = result.split(',')[1];
                updateUser({ ...user, profilePictureBase64: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
    <main className="max-w-[1200px] mx-auto p-5">
        <PageHeader onBack={() => setView('dashboard')} />
        <div className="bg-white rounded-xl border border-gray-200 p-10 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex flex-col items-center text-center">
                <div className="relative w-24 h-24">
                   <img 
                      src={user.profilePictureBase64 ? `data:image/jpeg;base64,${user.profilePictureBase64}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=5f84a9&color=fff`}
                      alt="Foto de perfil" 
                      className="w-24 h-24 rounded-full object-cover" 
                   />
                   <label htmlFor="photo-upload" className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md cursor-pointer hover:bg-gray-100 transition-colors">
                        <i className="fa-solid fa-camera text-gray-600"></i>
                        <input type="file" id="photo-upload" className="hidden" accept="image/png, image/jpeg" onChange={handlePhotoChange} />
                   </label>
                </div>

                <div className="text-2xl font-bold mt-3 text-brand-navy">{user.name}</div>
                <div className="text-gray-500">Cliente desde {new Date().getFullYear()}</div>
                 <div className="mt-8 flex gap-3">
                    <button onClick={onEdit} className="px-5 py-2.5 rounded-lg font-semibold bg-brand-red text-white hover:opacity-90">Editar Perfil</button>
                    <button onClick={onLogout} className="px-5 py-2.5 rounded-lg font-semibold border border-gray-200 hover:bg-gray-50">Sair</button>
                </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-brand-navy">Informações Pessoais</h3>
                    <div className="space-y-3 text-gray-600">
                        <div className="flex items-center gap-3"><i className="fa-regular fa-envelope w-5 text-center"></i> {user.email}</div>
                        <div className="flex items-center gap-3"><i className="fa-solid fa-phone w-5 text-center"></i> {user.phone}</div>
                        <div className="flex items-center gap-3"><i className="fa-solid fa-location-dot w-5 text-center"></i> {user.cep}</div>
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-semibold mb-4 text-brand-navy">Estatísticas</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between"><span>Serviços contratados:</span> <span className="font-semibold">0</span></div>
                        <div className="flex justify-between"><span>Avaliação média:</span> <span className="font-semibold"><i className="fa-solid fa-star text-gray-300"></i> N/A</span></div>
                        <div className="flex justify-between"><span>Economia total:</span> <span className="font-semibold text-green-600">R$ 0,00</span></div>
                    </div>
                </div>
                <div className="md:col-span-2 mt-4 pt-4 border-t">
                    <h3 className="text-xl font-semibold mb-2 text-brand-navy">Suporte</h3>
                    <button onClick={() => setView('help')} className="font-semibold text-brand-red hover:opacity-80">
                        <i className="fa-solid fa-life-ring mr-2"></i>Acessar Central de Ajuda
                    </button>
                </div>
            </div>
        </div>
    </main>
    );
};

const MessagesView: React.FC<{ setView: (view: ClientView) => void }> = ({ setView }) => (
    <main className="max-w-[1200px] mx-auto p-5">
        <PageHeader onBack={() => setView('dashboard')}>
            <h1 className="text-xl font-semibold text-brand-navy">Mensagens</h1>
        </PageHeader>
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-5 text-brand-navy">Suas Conversas</h2>
            <div className="space-y-3">
                 <div className="text-center py-10 text-gray-500">
                    <p>Nenhuma conversa encontrada.</p>
                </div>
            </div>
        </div>
    </main>
);

const RequestQuoteStep1View: React.FC<{ setView: (view: ClientView) => void }> = ({ setView }) => (
    <main className="max-w-[1200px] mx-auto p-5">
        <PageHeader onBack={() => setView('dashboard')} />
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
            <p className="font-semibold text-brand-navy">Solicitar Orçamento</p>
            <p className="text-sm text-gray-500 mb-4">Passo 1 de 2 - Selecione o serviço</p>
            <h1 className="text-4xl font-bold mb-2 text-brand-navy">Qual serviço você precisa?</h1>
            <p className="text-gray-500 mb-8">Selecione o tipo de serviço que você está procurando</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {services.map(service => {
                    const IconComponent = service.icon;
                    return (
                        <div key={service.name} onClick={() => setView('quote-step2')} className="bg-white rounded-xl border-2 border-gray-200 p-5 flex flex-col items-center justify-center gap-2 font-semibold text-center cursor-pointer hover:border-brand-red hover:text-brand-red transition-colors">
                            <div className="text-3xl text-brand-red h-8 w-8 flex items-center justify-center"><IconComponent /></div>
                            <span className="text-sm">{service.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    </main>
);

const RequestQuoteStep2View: React.FC<{ 
    setView: (view: ClientView) => void;
    addServiceRequest: (request: ServiceRequest) => void;
    currentUser: User;
    category: ServiceCategory;
    isEmergency: boolean;
}> = ({ setView, addServiceRequest, currentUser, category, isEmergency }) => {
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [photo, setPhoto] = useState<{ preview: string; base64: string | null }>({ preview: 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none"%3e%3cpath fill="%23F3F4F6" d="M0 0h80v80H0z"/%3e%3cpath fill-rule="evenodd" clip-rule="evenodd" d="M36.182 38.818a2 2 0 10-2.828-2.828 2 2 0 002.828 2.828zM34 38a2 2 0 11-4 0 2 2 0 014 0z" fill="%23D1D5DB"/%3e%3cpath d="M48 57.5L38.5 48l-15 15h34L48 57.5z" fill="%23D1D5DB"/%3e%3c/svg%3e', base64: null });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPhoto({
                    preview: result,
                    base64: result.split(',')[1] 
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newRequest: ServiceRequest = {
            id: new Date().toISOString(),
            clientName: currentUser.name,
            clientEmail: currentUser.email,
            address,
            contact: currentUser.phone,
            category: category,
            description,
            photoBase64: photo.base64,
            status: 'Pendente',
            isEmergency: isEmergency,
            requestDate: new Date().toISOString(),
        };
        addServiceRequest(newRequest);
        setView('quotes-received');
    };
    
    return (
    <main className="max-w-[1200px] mx-auto p-5">
        <PageHeader onBack={() => setView('quote-step1')} />
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="text-center mb-8">
                {isEmergency && (
                    <div className="mb-4 text-brand-red font-bold text-lg flex items-center justify-center gap-2">
                        <i className="fa-solid fa-bolt"></i>
                        <span>SOLICITAÇÃO DE EMERGÊNCIA</span>
                    </div>
                )}
                 <p className="font-semibold text-brand-navy">Solicitar Orçamento</p>
                <p className="text-sm text-gray-500 mb-4">Passo 2 de 2 - Detalhes da solicitação</p>
                <h1 className="text-4xl font-bold mb-2 text-brand-navy">Descreva seu problema</h1>
                <p className="text-gray-500">Quanto mais detalhes, melhor será o orçamento</p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="description" className="block font-semibold mb-2">Descrição do problema</label>
                    <textarea 
                        id="description"
                        placeholder="Descreva detalhadamente o que precisa ser feito..." 
                        rows={4} 
                        className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="address" className="block font-semibold mb-2">Endereço</label>
                    <input 
                        id="address"
                        type="text" 
                        placeholder="Rua, número, bairro, cidade..." 
                        className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block font-semibold mb-2">Data preferencial</label>
                        <input type="date" className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    </div>
                    <div>
                        <label className="block font-semibold mb-2">Horário preferencial</label>
                        <input type="time" className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    </div>
                </div>
                <div>
                    <label className="block font-semibold mb-2">Urgência</label>
                    <div className="flex gap-2">
                        <button type="button" className={`flex-1 p-3 rounded-lg font-semibold border ${isEmergency ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-100'}`} disabled={isEmergency}>Normal</button>
                        <button type="button" className={`flex-1 p-3 rounded-lg font-semibold border ${isEmergency ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-100'}`} disabled={isEmergency}>Urgente</button>
                        <button type="button" className={`flex-1 p-3 rounded-lg font-semibold ${isEmergency ? 'bg-brand-red text-white' : 'border border-gray-300'}`}>Emergência</button>
                    </div>
                </div>
                <div>
                    <label className="block font-semibold mb-2">Fotos (opcional)</label>
                    <input 
                        type="file" 
                        id="photo-upload-service" 
                        className="hidden" 
                        accept="image/png, image/jpeg" 
                        onChange={handlePhotoChange}
                    />
                    <label htmlFor="photo-upload-service" className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-brand-blue block">
                        {photo.base64 ? (
                             <img src={photo.preview} alt="Pré-visualização" className="max-h-40 mx-auto rounded-md mb-4" />
                        ) : (
                            <img src={photo.preview} alt="Placeholder" className="h-20 w-20 mx-auto mb-2" />
                        )}
                        <i className="fa-solid fa-arrow-up-from-bracket text-2xl text-gray-400 mb-2"></i>
                        <p className="font-semibold">Clique para adicionar fotos do problema</p>
                        <span className="text-sm text-gray-500">PNG, JPG até 5MB cada</span>
                    </label>
                </div>
                <div className="flex justify-between mt-6">
                    <button type="button" onClick={() => setView('quote-step1')} className="px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100"><i className="fa-solid fa-arrow-left mr-2"></i>Voltar</button>
                    <button type="submit" className="px-6 py-3 rounded-lg font-semibold bg-brand-red text-white hover:opacity-90">Enviar Solicitação</button>
                </div>
            </form>
        </div>
    </main>
    );
};

const QuotesReceivedView: React.FC<{ setView: (view: ClientView) => void; requests: ServiceRequest[]; onAccept: (id: string) => void; user: User; }> = ({ setView, requests, onAccept, user }) => {
    const myRequests = requests.filter(r => r.clientEmail === user.email);
    const pending = myRequests.filter(r => r.status === 'Pendente');
    const withQuotes = myRequests.filter(r => r.status === 'Orçamento Enviado' && typeof r.quote === 'number' && r.quote > 0);

    return (
        <main className="max-w-[1200px] mx-auto p-5">
            <PageHeader onBack={() => setView('dashboard')} />
            <div className="bg-brand-blue/10 border border-brand-blue/20 p-4 rounded-lg mb-8 flex items-center gap-3">
                <i className="fa-solid fa-location-dot text-brand-blue text-2xl" />
                <div>
                    <div className="font-semibold text-brand-navy">Solicitações de Serviço</div>
                    <div className="text-gray-600 text-sm">Acompanhe abaixo pedidos aguardando orçamento e orçamentos já enviados.</div>
                </div>
            </div>

            {/* Aguardando orçamento */}
            <h2 className="text-xl font-semibold text-brand-navy mb-4">Aguardando Orçamento ({pending.length})</h2>
            {pending.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200 mb-8">
                    <p className="text-gray-500 text-sm">Nenhuma solicitação aguardando orçamento.</p>
                </div>
            )}
            <div className="flex flex-col gap-4 mb-10">
                {pending.map(req => (
                    <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-500">{new Date(req.requestDate).toLocaleDateString('pt-BR')} • {req.category}</div>
                            <div className="font-semibold text-brand-navy truncate">{req.description}</div>
                            <div className="text-xs mt-1 inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">Pendente</div>
                        </div>
                        <div className="text-xs text-gray-500 w-full md:w-auto">Aguardando envio de orçamento pelo prestador...</div>
                    </div>
                ))}
            </div>

            {/* Orçamentos recebidos */}
            <h2 className="text-xl font-semibold text-brand-navy mb-4">Orçamentos Recebidos ({withQuotes.length})</h2>
            {withQuotes.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200 mb-8">
                    <p className="text-gray-500 text-sm">Ainda não há orçamentos enviados. Assim que um prestador enviar, aparecerá aqui.</p>
                </div>
            )}
            <div className="flex flex-col gap-4">
                {withQuotes.map(req => (
                    <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-500">{new Date(req.requestDate).toLocaleDateString('pt-BR')} • {req.category}</div>
                            <div className="font-semibold text-brand-navy truncate">{req.description}</div>
                            <div className="text-sm text-gray-600 mt-1">Orçamento: <span className="font-semibold text-green-600">R$ {req.quote?.toFixed(2)}</span></div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => onAccept(req.id)} className="px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 flex-1 md:flex-none">Aceitar</button>
                            {/* Futuro: botão recusar orçamento individual */}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

const ServiceCategoryView: React.FC<{ setView: (view: ClientView) => void, category: ServiceCategory }> = ({ setView, category }) => {
    const subServicesData: Record<string, { name: string; icon: React.ReactElement }[]> = {
        'Montagem de Móveis': [
            { name: 'Montagem de Guarda-roupa', icon: <HammerIcon /> },
            { name: 'Montagem de Cama', icon: <HammerIcon /> },
            { name: 'Montagem de Mesa', icon: <HammerIcon /> },
            { name: 'Montagem de Estante', icon: <HammerIcon /> },
        ],
        'Reparos Gerais': [
            { name: 'Instalação de Prateleira', icon: <WrenchIcon /> },
            { name: 'Conserto de Maçaneta', icon: <WrenchIcon /> },
            { name: 'Pequenos Reparos', icon: <WrenchIcon /> },
            { name: 'Ajustes Diversos', icon: <WrenchIcon /> },
        ],
        'Elétrica': [
            { name: 'Instalação de Tomada', icon: <ZapIcon /> },
            { name: 'Troca de Chuveiro', icon: <ZapIcon /> },
            { name: 'Instalação de Luminária', icon: <ZapIcon /> },
            { name: 'Reparo Elétrico Simples', icon: <ZapIcon /> },
        ],
        'Hidráulica': [
            { name: 'Conserto de Vazamento', icon: <DropletsIcon /> },
            { name: 'Troca de Torneira', icon: <DropletsIcon /> },
            { name: 'Desentupimento', icon: <DropletsIcon /> },
            { name: 'Instalação de Vaso', icon: <DropletsIcon /> },
        ],
        'Pintura': [
            { name: 'Pintura de Parede', icon: <PaintBucketIcon /> },
            { name: 'Pintura de Porta', icon: <PaintBucketIcon /> },
            { name: 'Reparo em Pintura', icon: <PaintBucketIcon /> },
            { name: 'Pequenos Retoques', icon: <PaintBucketIcon /> },
        ],
        'Manutenção Geral': [
             { name: 'Limpeza de Calhas', icon: <HouseIcon /> },
             { name: 'Verificação de Telhado', icon: <HouseIcon /> },
             { name: 'Manutenção Preventiva', icon: <HouseIcon /> },
             { name: 'Serviços Diversos', icon: <HouseIcon /> },
        ],
        'Informática': [
             { name: 'Instalação de Rede', icon: <MonitorIcon /> },
             { name: 'Limpeza de Computador', icon: <MonitorIcon /> },
             { name: 'Limpeza de Impressora', icon: <MonitorIcon /> },
             { name: 'Outros', icon: <MonitorIcon /> },
        ],
        'CFTV': [
             { name: 'Instalação de Câmera', icon: <CctvIcon /> },
             { name: 'Configuração de DVR', icon: <CctvIcon /> },
             { name: 'Manutenção de Sistema', icon: <CctvIcon /> },
             { name: 'Ajuste de Câmeras', icon: <CctvIcon /> },
        ],
    };

    const currentCategoryData = services.find(s => s.name === category) || services[0];
    const currentSubServices = subServicesData[category] || [];
    const IconComponent = currentCategoryData.icon;

    return (
     <main className="max-w-[1200px] mx-auto p-5">
        <PageHeader onBack={() => setView('dashboard')} title="Voltar">
             <h1 className="text-xl font-semibold text-brand-navy">{category}</h1>
        </PageHeader>
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
            <div className="inline-block text-brand-red mb-4">
                <IconComponent className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-bold mb-2 text-brand-navy">Qual tipo de serviço de {category.toLowerCase()}?</h1>
            <p className="text-gray-500 mb-8">Selecione o serviço específico que você precisa</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentSubServices.map(item => (
                    <div key={item.name} onClick={() => setView('quote-step2')} className="bg-white rounded-xl border-2 border-gray-200 p-5 flex flex-col items-center justify-center gap-2 font-semibold text-center cursor-pointer hover:border-brand-red hover:text-brand-red transition-colors">
                        <div className="text-brand-red h-8 w-8 flex items-center justify-center">{React.cloneElement(item.icon, { className: 'w-6 h-6' })}</div>
                        <span className="text-sm">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    </main>
    );
};

const EmergencyView: React.FC<{ setView: (view: ClientView) => void, onConfirm: () => void }> = ({ setView, onConfirm }) => (
    <main className="max-w-[1200px] mx-auto p-5">
        <PageHeader onBack={() => setView('dashboard')} />
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
            <i className="fa-solid fa-bolt text-5xl text-brand-red mb-4"></i>
            <h1 className="text-3xl font-bold mb-2 text-brand-navy">Solicitação de Emergência</h1>
            <div className="text-gray-600 space-y-4 mb-8">
                <p>Esta funcionalidade conecta você a prestadores próximos com disponibilidade para atendimento imediato.</p>
                <p>Serviços de emergência têm <strong className="font-semibold text-gray-800">prioridade máxima</strong> e os prestadores são notificados instantaneamente.</p>
                <p className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3">
                    <strong className="font-semibold">Atenção:</strong> O valor do serviço pode ser de <strong className="font-semibold">20% a 25% maior</strong> que o normal, a ser confirmado no orçamento do prestador.
                </p>
            </div>
            <div className="flex justify-center gap-4">
                 <button onClick={() => setView('dashboard')} className="px-6 py-2.5 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100">Cancelar</button>
                 <button onClick={onConfirm} className="px-6 py-2.5 rounded-lg font-semibold bg-brand-red text-white hover:opacity-90">Entendi, solicitar emergência</button>
            </div>
        </div>
    </main>
);

const HelpView: React.FC<{ setView: (view: ClientView) => void }> = ({ setView }) => (
    <main className="max-w-[1200px] mx-auto p-5">
        <PageHeader onBack={() => setView('profile')} title="Voltar ao Perfil" />
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h1 className="text-3xl font-bold mb-6 text-center text-brand-navy">Central de Ajuda</h1>
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-2 text-brand-navy">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Como solicito um orçamento?</h3>
                            <p className="text-gray-600">No painel principal, clique em "Solicitar Orçamento", selecione a categoria do serviço e preencha os detalhes do que você precisa.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Meus dados estão seguros?</h3>
                            <p className="text-gray-600">Sim, levamos a segurança a sério. Seus dados são armazenados de forma segura e compartilhados com os prestadores apenas quando você autoriza.</p>
                        </div>
                    </div>
                </div>
                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-2 text-brand-navy">Ainda precisa de ajuda?</h2>
                    <p className="text-gray-600">
                        Se não encontrou a resposta que procurava, entre em contato com nossa equipe de suporte pelo e-mail: <a href="mailto:resolveproblemas.eagle@gmail.com" className="text-brand-red font-semibold hover:underline">resolveproblemas.eagle@gmail.com</a>
                    </p>
                </div>
            </div>
        </div>
    </main>
);

const ClientPage: React.FC<ClientPageProps> = ({ currentUser, addServiceRequest, onLogout, updateUser, requests, updateRequestStatus }) => {
  const [view, setView] = useState<ClientView>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('Montagem de Móveis');
  const [isEmergencyRequest, setIsEmergencyRequest] = useState(false);

  const handleServiceClick = (category: ServiceCategory) => {
      setSelectedCategory(category);
      setView('service-category');
  };

  const handleStartEmergencyRequest = () => {
    setIsEmergencyRequest(true);
    setView('quote-step1');
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardView setView={setView} handleServiceClick={handleServiceClick} />;
      case 'profile':
        return <ProfileView setView={setView} onLogout={onLogout} user={currentUser} onEdit={() => setView('edit-profile')} updateUser={updateUser} />;
      case 'edit-profile':
        return <EditProfileView 
                  user={currentUser} 
                  onSave={(updatedUser) => {
                      updateUser(updatedUser);
                      setView('profile');
                  }}
                  onCancel={() => setView('profile')}
              />;
      case 'messages':
        return <MessagesView setView={setView} />;
      case 'quote-step1':
        return <RequestQuoteStep1View setView={setView} />;
      case 'quote-step2':
        return <RequestQuoteStep2View setView={setView} addServiceRequest={addServiceRequest} currentUser={currentUser} category={selectedCategory} isEmergency={isEmergencyRequest} />;
      case 'quotes-received':
          return <QuotesReceivedView 
                    setView={setView} 
                    requests={requests} 
                    user={currentUser}
                    onAccept={(id) => {
                        updateRequestStatus(id, 'Aceito');
                        // feedback
                        window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Orçamento aceito e serviço confirmado!', type: 'success' } }));
                        setView('dashboard');
                    }}
                 />;
      case 'service-category':
          return <ServiceCategoryView setView={setView} category={selectedCategory} />;
      case 'emergency':
        return <EmergencyView setView={setView} onConfirm={handleStartEmergencyRequest} />;
      case 'help':
        return <HelpView setView={setView} />;
      default:
        return <DashboardView setView={setView} handleServiceClick={handleServiceClick} />;
    }
  };

  return (
    <div className="bg-slate-50 text-[#344054] min-h-screen">
      {renderContent()}
    </div>
  );
};

export default ClientPage;
