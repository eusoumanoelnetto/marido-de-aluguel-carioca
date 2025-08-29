import React, { useState, useEffect, useMemo } from 'react';
import { ServiceRequest, User } from '../types';

interface ProviderPageProps {
  currentUser: User;
  requests: ServiceRequest[];
  onLogout: () => void;
    updateRequestStatus: (id: string, status: ServiceRequest['status'], quote?: number, providerEmail?: string) => void;
  updateUser: (user: User) => void;
}

type ProviderView = 'dashboard' | 'quotes' | 'messages' | 'profile' | 'edit-profile' | 'service-detail' | 'public-profile' | 'clients' | 'agenda' | 'today-services' | 'help';

const profilePageStyles = `
    :root {
        --red-primary: #b61f16;
        --blue-primary: #3c84c1;
        --text-dark: #0b3051; 
        --text-body: #374151; 
        --text-light: #6b7280;
        --border-color: #e5e7eb;
        --bg-page: #f9fafb; 
        --bg-card: #ffffff;
        --green-price: #16a34a; 
        --yellow-star: #f59e0b;
    }
    #provider-profile-container .card { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 40px; max-width: 500px; margin: 2rem auto; }
    #provider-profile-container .btn { padding: 10px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; cursor: pointer; border: 1px solid transparent; transition: all 0.2s ease; font-size: 0.95rem; }
    #provider-profile-container .btn-red { background-color: var(--red-primary); color: #fff; } .btn-red:hover { opacity: 0.9; }
    #provider-profile-container .btn-secondary { background: var(--bg-card); color: var(--text-body); border-color: #d1d5db; } .btn-secondary:hover { background-color: #f9fafb; }
    
    /* PÁGINA: VISUALIZAR PERFIL */
    #view-profile-page .profile-header { text-align: center; }
    #view-profile-page .avatar { width: 90px; height: 90px; border-radius: 50%; background-color: #3c84c120; color: var(--blue-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 2.5rem; margin-bottom: 16px; overflow: hidden; }
    #view-profile-page .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    #view-profile-page .name { font-size: 1.5rem; font-weight: 600; color: var(--text-dark); }
    #view-profile-page .since { color: var(--text-light); margin-bottom: 24px; }
    #view-profile-page .actions { display: flex; justify-content: center; gap: 12px; margin-bottom: 32px; border-bottom: 1px solid var(--border-color); padding-bottom: 32px; }
    #view-profile-page h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-dark); margin-top: 32px; margin-bottom: 20px; }
    #view-profile-page .info-item { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; font-size: 0.9rem; }
    #view-profile-page .info-item i { color: var(--text-light); width: 20px; text-align: center;}
    #view-profile-page .stat-item { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.9rem; margin-bottom: 12px; }
    #view-profile-page .value { font-weight: 600; font-size: 1rem; color: var(--text-dark);}
    #view-profile-page .value .fa-star { color: var(--yellow-star); font-size: 0.9rem;}
    #view-profile-page .value.green { color: var(--green-price); }
    #view-profile-page .services-tags { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
    #view-profile-page .tag { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 8px; background: var(--bg-page); font-weight: 500; font-size: 0.85rem;}
    
    /* PÁGINA: EDITAR PERFIL */
    #edit-profile-page h1 { text-align: center; font-size: 1.8rem; font-weight: 600; color: var(--text-dark); margin-bottom: 24px; }
    #edit-profile-page .photo-uploader { position: relative; width: 100px; height: 100px; margin: 0 auto 32px auto; cursor: pointer; }
    #edit-profile-page #avatar-preview { width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; background-color: #3c84c120; color: var(--blue-primary); font-size: 3rem; overflow: hidden;}
    #edit-profile-page .avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    #edit-profile-page .edit-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background-color: rgba(0,0,0,0.5); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; opacity: 0; transition: opacity 0.3s ease; }
    #edit-profile-page .photo-uploader:hover .edit-overlay { opacity: 1; }
    #edit-profile-page .hidden-file-input { display: none; }
    #edit-profile-page label { display: block; font-weight: 500; margin-bottom: 8px; font-size: 0.9rem; }
    #edit-profile-page .input-group { margin-bottom: 20px; }
    #edit-profile-page input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        font-family: 'Poppins', sans-serif;
        background-color: #f3f4f6;
        color: var(--text-dark);
        color-scheme: light;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    #edit-profile-page input::placeholder {
        color: #9ca3af;
    }
    #edit-profile-page input:focus {
        outline: none;
        border-color: var(--blue-primary);
        box-shadow: 0 0 0 3px rgba(60, 132, 193, 0.2);
    }
    #edit-profile-page input:disabled {
        background-color: #e5e7eb;
        color: #6b7280;
        cursor: not-allowed;
    }
    #edit-profile-page .services-container { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    #edit-profile-page .service-tag { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-card); cursor: pointer; transition: all 0.2s ease; font-size: 0.9rem; }
    #edit-profile-page .service-tag.selected { background-color: var(--red-primary); color: #fff; border-color: var(--red-primary); }
    #edit-profile-page .service-tag i { width: 20px; text-align: center; }
    #edit-profile-page .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; border-top: 1px solid var(--border-color); padding-top: 24px; }
`;

const ProviderHeader: React.FC<{
  setView: (view: ProviderView) => void;
}> = ({ setView }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('dashboard')}>
            <img src="https://wngalbve.manus.space/assets/logo_marido_aluguel_3-CqPHQ69B.png" alt="Logo" className="h-12" />
          </div>
          <nav className="flex items-center gap-4 md:gap-6 text-gray-600 font-medium">
            <button
              onClick={() => setView('quotes')}
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
  );
};


const ProviderPublicProfile: React.FC<{
    onBack: () => void;
    currentUser: User;
    requests: ServiceRequest[];
}> = ({ onBack, currentUser, requests }) => {
    interface Review {
      id: number;
      name: string;
      initials: string;
      color: string;
      date: string; // ISO string for sorting
      rating: number;
      text: string;
      service: string;
      timeAgo: string; // display string
    }

    const mockReviews: Review[] = [
      { id: 4, name: 'Roberto Dias', initials: 'RD', color: '#2dd4bf', date: '2024-07-25T11:00:00Z', rating: 5, text: "Serviço rápido e eficiente. O profissional foi muito educado e resolveu meu problema elétrico em minutos.", service: 'Reparo Elétrico', timeAgo: 'Há 3 dias' },
      { id: 1, name: 'Maria S.', initials: 'MS', color: '#a78bfa', date: '2024-07-15T10:00:00Z', rating: 5, text: "Serviço impecável! O Carlos foi extremamente profissional e cuidadoso na montagem do meu guarda-roupa. Chegou no horário e deixou tudo limpo. Recomendo muito!", service: 'Montagem de Guarda-Roupa', timeAgo: 'Há 2 semanas' },
      { id: 6, name: 'Lucas Martins', initials: 'LM', color: '#93c5fd', date: '2024-07-05T08:00:00Z', rating: 4, text: "A montagem da estante foi bem feita, mas o montador se atrasou um pouco. No geral, fiquei satisfeito.", service: 'Montagem de Estante', timeAgo: 'Há 3 semanas' },
      { id: 2, name: 'João Costa', initials: 'JC', color: '#4ade80', date: '2024-06-28T14:30:00Z', rating: 5, text: "Contratei para um pequeno reparo na torneira da cozinha. Resolveu o problema rapidamente e foi muito honesto no preço. Ótimo profissional.", service: 'Reparo Hidráulico', timeAgo: 'Há 1 mês' },
      { id: 3, name: 'Ana Pereira', initials: 'AP', color: '#fcd34d', date: '2024-05-10T09:00:00Z', rating: 4, text: "O serviço foi bom e o móvel foi montado corretamente. A única observação é que ele se atrasou um pouco para chegar, mas avisou com antecedência.", service: 'Montagem de Estante', timeAgo: 'Há 2 meses' },
      { id: 5, name: 'Carla Mendes', initials: 'CM', color: '#fb923c', date: '2024-03-20T16:00:00Z', rating: 3, text: "O serviço de pintura ficou bom, mas o pintor sujou um pouco o chão. Poderia ter tido mais cuidado com a forração.", service: 'Pintura de Parede', timeAgo: 'Há 4 meses' },
    ];
    
    const [reviewFilter, setReviewFilter] = useState<'recent' | 'rating'>('recent');
    const [visibleReviewsCount, setVisibleReviewsCount] = useState(3);

    const sortedReviews = useMemo(() => {
        const sorted = [...mockReviews];
        if (reviewFilter === 'rating') {
            sorted.sort((a, b) => b.rating - a.rating || new Date(b.date).getTime() - new Date(a.date).getTime());
        } else { // 'recent'
            sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return sorted;
    }, [reviewFilter]);
    
    const displayedReviews = sortedReviews.slice(0, visibleReviewsCount);

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <i key={i} className={`${i <= rating ? 'fas' : 'far'} fa-star`} style={i > rating ? { color: '#d1d5db' } : {}}></i>
            );
        }
        return <div className="review-rating">{stars}</div>;
    };
    
    const completedJobs = requests.filter(r => r.status === 'Finalizado').length;

    const publicProfileCSS = `
        .profile-page-body {
            font-family: 'Poppins', sans-serif;
            background-color: #f9fafb;
            color: #374151;
            -webkit-font-smoothing: antialiased;
        }
        .main-container-profile {
            max-width: 800px;
            margin: 32px auto 0;
            padding: 0 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        .profile-page-body .card { 
            --blue-primary: #3c84c1;
            --text-dark: #0b3051; 
            --text-body: #374151; 
            --text-light: #6b7280;
            --border-color: #e5e7eb;
            --bg-page: #f9fafb; 
            --bg-card: #ffffff;
            --bg-tag: #f3f4f6;
            --yellow-star: #f59e0b;
            background-color: var(--bg-card); 
            border: 1px solid var(--border-color); 
            border-radius: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.03);
        }
        .profile-hero { padding: 32px; display: flex; flex-direction: column; }
        .profile-header { display: flex; align-items: center; gap: 20px; }
        .profile-header .avatar {
            width: 80px; height: 80px; flex-shrink: 0;
            border-radius: 50%; background-color: var(--blue-primary); color: #fff;
            display: grid; place-items: center; font-size: 2.5rem;
        }
        .profile-header h1 { font-size: 1.8rem; font-weight: 600; color: var(--text-dark); margin-bottom: 2px; }
        .profile-header .meta { font-size: 0.9rem; color: #6b7280; }
        .profile-header .services-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .profile-header .tag { background-color: #f3f4f6; padding: 4px 12px; border-radius: 16px; font-size: 0.8rem; color: #6b7280; }
        .profile-stats {
            padding-top: 24px; margin-top: 24px; border-top: 1px solid #e5e7eb;
            display: grid; grid-template-columns: repeat(3, 1fr); text-align: center;
        }
        .stat-item .value { font-size: 1.25rem; font-weight: 600; color: var(--text-dark); }
        .stat-item .value .fa-star { color: var(--yellow-star); }
        .stat-item .label { font-size: 0.8rem; color: #6b7280; }
        .details-section { padding: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .section-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: var(--text-dark); }
        .details-section p, .details-section li { font-size: 0.9rem; line-height: 1.7; color: #6b7280; }
        .details-section ul { list-style: none; padding-left: 0; }
        .details-section li { margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; }
        .details-section li .fa-check { color: var(--blue-primary); margin-top: 4px; font-size: 0.8rem; }
        .reviews-section { padding: 32px; }
        .reviews-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .review-filters button { background-color: transparent; color: #6b7280; border: 1px solid transparent; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
        .review-filters button:hover { background-color: #f3f4f6; }
        .review-filters button.active { background-color: var(--blue-primary); color: #fff; }
        .review-card { border-bottom: 1px solid #e5e7eb; padding: 24px 0; }
        .review-card:first-of-type { padding-top: 16px; }
        .review-card:last-of-type { border-bottom: none; padding-bottom: 0; }
        .review-card .review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .review-avatar { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-weight: 500; font-size: 0.9rem; color: #fff; }
        .review-name { font-weight: 600; color: #1f2937; }
        .review-date { margin-left: auto; font-size: 0.8rem; color: #6b7280; }
        .review-rating { color: #f59e0b; margin-bottom: 8px; }
        .review-body p { line-height: 1.7; color: #374151; font-size: 0.95rem; }
        .review-service-tag { display: inline-block; background-color: #eef2ff; color: #4338ca; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 500; margin-top: 12px; }
        .load-more-wrapper { text-align: center; margin-top: 24px; }
        .load-more-btn {
            background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            padding: 12px 24px; font-weight: 500;
            color: #1f2937; cursor: pointer; border-radius: 12px; transition: background-color 0.2s ease;
        }
        .load-more-btn:hover { background-color: #f9fafb; }
         @media (max-width: 640px) {
            .details-section { grid-template-columns: 1fr; }
            .reviews-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        }
    `;

    return (
        <div className="profile-page-body">
            <style>{publicProfileCSS}</style>
             <header className="flex items-center p-4 mb-4 max-w-[800px] mx-auto w-full bg-transparent">
                <button onClick={onBack} className="font-semibold text-brand-navy hover:text-black bg-white/70 backdrop-blur-sm p-2 px-4 rounded-lg border border-gray-200">
                    <i className="fa-solid fa-arrow-left mr-2"></i> Voltar ao Dashboard
                </button>
            </header>
            <main className="main-container-profile !pt-0 !mt-0">
                <section className="card profile-hero">
                    <div className="profile-header">
                        <div className="avatar"><i className="fas fa-user"></i></div>
                        <div>
                            <h1>{currentUser.name}</h1>
                            <p className="meta">Membro desde Julho, 2023</p>
                            <div className="services-tags">
                                {currentUser.services && currentUser.services.length > 0 ? (
                                    currentUser.services.map(service => (
                                        <span key={service} className="tag">{service}</span>
                                    ))
                                ) : (
                                    <span className="tag">Nenhum serviço principal</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="profile-stats">
                        <div className="stat-item">
                            <div className="value"><i className="fas fa-star"></i> 4.9</div>
                            <div className="label">Média de Avaliações</div>
                        </div>
                        <div className="stat-item">
                            <div className="value">{mockReviews.length}</div>
                            <div className="label">Avaliações</div>
                        </div>
                         <div className="stat-item">
                            <div className="value">{completedJobs}</div>
                            <div className="label">Trabalhos Concluídos</div>
                        </div>
                    </div>
                </section>

                <section className="card details-section">
                    <div>
                        <h2 className="section-title">Sobre Mim</h2>
                        <p>Profissional com mais de 8 anos de experiência em montagem de móveis, pequenos reparos e manutenção residencial. Prezo pela pontualidade, organização e um serviço de alta qualidade para garantir a sua total satisfação.</p>
                    </div>
                    <div>
                        <h2 className="section-title">Serviços Oferecidos</h2>
                        <ul>
                            {currentUser.services && currentUser.services.length > 0 ? (
                                currentUser.services.map(service => (
                                    <li key={service}><i className="fas fa-check"></i> {service}</li>
                                ))
                            ) : (
                                <li className="!items-center">Nenhum serviço especificado.</li>
                            )}
                        </ul>
                    </div>
                </section>

                <section className="card reviews-section">
                    <div className="reviews-header">
                        <h2 className="section-title">Avaliações e Feedback ({mockReviews.length})</h2>
                        <div className="review-filters">
                            <button 
                                className={`filter-btn ${reviewFilter === 'recent' ? 'active' : ''}`}
                                onClick={() => setReviewFilter('recent')}
                            >
                                Mais Recentes
                            </button>
                            <button 
                                className={`filter-btn ${reviewFilter === 'rating' ? 'active' : ''}`}
                                onClick={() => setReviewFilter('rating')}
                            >
                                Maior Nota
                            </button>
                        </div>
                    </div>
                    <div className="reviews-list">
                        {displayedReviews.map(review => (
                             <article key={review.id} className="review-card">
                                <div className="review-header">
                                    <div className="review-avatar" style={{backgroundColor: review.color}}>{review.initials}</div>
                                    <div className="review-name">{review.name}</div>
                                    <span className="review-date">{review.timeAgo}</span>
                                </div>
                                {renderStars(review.rating)}
                                <div className="review-body">
                                    <p>"{review.text}"</p>
                                    <span className="review-service-tag">Serviço: {review.service}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                    {visibleReviewsCount < sortedReviews.length && (
                        <div className="load-more-wrapper">
                             <button
                                className="load-more-btn"
                                onClick={() => setVisibleReviewsCount(prev => prev + 3)}
                             >
                                Carregar mais avaliações
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};


const getStatusDetails = (status: ServiceRequest['status']) => {
    switch (status) {
        case 'Orçamento Enviado':
            return { text: 'Aguardando Cliente', className: 'bg-[#e0f2fe] text-[#075985]' };
        case 'Aceito':
            return { text: 'Confirmado', className: 'bg-[#dcfce7] text-[#166534]' };
        case 'Pendente':
            return { text: 'Pendente', className: 'bg-[#fef9c3] text-[#854d0e]' };
        case 'Finalizado':
            return { text: 'Concluído', className: 'bg-[#f3f4f6] text-[#4b5563]' };
        case 'Recusado':
            return { text: 'Recusado', className: 'bg-red-100 text-red-700' };
        default:
            return { text: status, className: 'bg-gray-100 text-gray-800' };
    }
};

const PageHeader: React.FC<{ onBack: () => void, title?: string, children?: React.ReactNode }> = ({ onBack, title, children }) => (
    <header className="flex items-center p-4 border-b border-gray-200 mb-8 max-w-7xl mx-auto w-full">
        <button onClick={onBack} className="font-semibold text-brand-navy hover:text-black">
            <i className="fa-solid fa-arrow-left mr-2"></i> {title ? title : 'Voltar'}
        </button>
        <div className="flex-grow text-center">
            {children}
        </div>
        <div className="w-24"></div>
    </header>
);

const StatCard: React.FC<{ icon: string; title: string; color: string; onClick?: () => void; children: React.ReactNode }> = ({ icon, title, color, onClick, children }) => (
    <div 
        className={`bg-white border border-gray-200 rounded-xl p-6 md:p-8 flex gap-5 items-center transition-transform transform hover:-translate-y-1 hover:shadow-xl ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <i className={`${icon} ${color} text-3xl md:text-4xl`}></i>
        <div>
            <div className="text-base text-gray-500">{title}</div>
            {children}
        </div>
    </div>
);


const AppointmentCard: React.FC<{ request: ServiceRequest; time?: string; onViewDetails: () => void; }> = ({ request, time, onViewDetails }) => {
    const status = getStatusDetails(request.status);
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-shadow hover:shadow-md">
            <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                {time && <span className="font-semibold text-base text-brand-navy min-w-[64px]">{time}</span>}
                <div className="min-w-0">
                    <h3 className="font-semibold text-lg text-brand-navy truncate">{`Serviço de ${request.category}`}</h3>
                    <p className="text-sm text-gray-500 truncate">Cliente: {request.clientName} - {request.address}</p>
                </div>
            </div>
            <div className="flex items-center sm:items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.className}`}>{status.text}</span>
              <button onClick={onViewDetails} className="bg-gray-100 text-gray-800 border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
                  Ver Detalhes
              </button>
            </div>
        </div>
    );
};

const ActionCard: React.FC<{ icon: string; title: string; description: string; onClick: () => void; }> = ({ icon, title, description, onClick }) => (
    <div onClick={onClick} className="bg-white border border-gray-200 rounded-xl p-6 text-center cursor-pointer transition-transform transform hover:-translate-y-1 hover:shadow-xl h-full flex flex-col items-center justify-center">
        <i className={`${icon} text-4xl mb-4 text-brand-navy`}></i>
        <h3 className="text-lg font-semibold mb-2 text-brand-navy">{title}</h3>
        <p className="text-base text-brand-muted-blue leading-relaxed">{description}</p>
    </div>
);

const AgendaView: React.FC<{
    requests: ServiceRequest[];
    onBack: () => void;
    onViewDetails: (request: ServiceRequest) => void;
}> = ({ requests, onBack, onViewDetails }) => {
    // Defaulting to the current date for consistency
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };
    
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const days = [];

        for (let i = firstDayOfMonth; i > 0; i--) {
            days.push({ day: daysInPrevMonth - i + 1, isOtherMonth: true });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, isOtherMonth: false });
        }
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, isOtherMonth: true });
        }
        
        return days;
    }, [currentDate]);

    const appointmentsForSelectedDay = useMemo(() => {
        return requests
            .filter(req => {
                const reqDate = new Date(req.requestDate);
                return reqDate.getFullYear() === selectedDate.getFullYear() &&
                       reqDate.getMonth() === selectedDate.getMonth() &&
                       reqDate.getDate() === selectedDate.getDate();
            })
            .sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());
    }, [requests, selectedDate]);

    const formatSelectedDate = (date: Date) => {
        return `${date.getDate()} de ${monthNames[date.getMonth()]}`;
    };

    const getAppointmentTime = (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusForAgenda = (status: ServiceRequest['status']) => {
        switch (status) {
            case 'Aceito': return { text: 'Confirmado', className: 'status--confirmed' };
            case 'Pendente': return { text: 'Pendente', className: 'status--pending' };
            case 'Finalizado': return { text: 'Concluído', className: 'status--completed' };
            case 'Recusado': return { text: 'Recusado', className: 'status--refused' };
            default: return { text: status, className: 'status--completed' };
        }
    };

    const agendaCSS = `
        :root {
            --blue-primary: #3c84c1;
            --text-dark: #0b3051; 
            --text-body: #374151; 
            --text-light: #6b7280;
            --border-color: #e5e7eb;
            --bg-page: #f9fafb; 
            --bg-card: #ffffff;
            --status-confirmed-bg: #dcfce7;
            --status-confirmed-text: #166534;
            --status-pending-bg: #fef9c3;
            --status-pending-text: #854d0e;
            --status-completed-bg: #f3f4f6;
            --status-completed-text: #4b5563;
        }
        .agenda-main-container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
        .agenda-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .main-title { font-size: 1.5rem; font-weight: 600; color: var(--text-dark); margin:0;}
        .agenda-container { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: flex-start; }
        .card { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); padding: 20px; }
        .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .calendar-header .month { font-weight: 600; color: var(--text-dark); font-size: 0.95rem; }
        .calendar-header .nav-arrows { color: var(--text-light); }
        .calendar-header .nav-arrows i { cursor: pointer; padding: 4px; }
        .weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; color: var(--text-light); font-size: 0.75rem; font-weight: 500; margin-bottom: 8px; }
        .days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .day { display: grid; place-items: center; aspect-ratio: 1 / 1; border-radius: 50%; cursor: pointer; font-size: 0.85rem; font-weight: 500; color: var(--text-body); transition: background-color 0.2s ease; }
        .day:not(.other-month):hover { background-color: #f3f4f6; }
        .day.other-month { color: #d1d5db; cursor: default; }
        .day.selected { background-color: var(--blue-primary); color: #fff; font-weight: 600; }
        .schedule-card h2 { font-size: 1rem; font-weight: 600; margin-bottom: 24px; color: var(--text-dark); }
        .appointments-list { display: flex; flex-direction: column; gap: 24px; }
        .appointment { border-bottom: 1px solid var(--border-color); padding-bottom: 24px; cursor: pointer; transition: background-color .2s; }
        .appointment:hover { background-color: #fafafa; }
        .appointment:last-child { border-bottom: none; padding-bottom: 0; }
        .appointment .time { font-size: 0.8rem; font-weight: 500; color: var(--text-light); margin-bottom: 4px; }
        .appointment .title { font-size: 1rem; font-weight: 600; color: var(--text-dark); margin-bottom: 6px; }
        .appointment .details { font-size: 0.85rem; color: var(--text-light); margin-bottom: 12px; }
        .status-tag { display: inline-block; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; font-weight: 500; }
        .status--confirmed { background-color: var(--status-confirmed-bg); color: var(--status-confirmed-text); }
        .status--pending { background-color: var(--status-pending-bg); color: var(--status-pending-text); }
        .status--completed { background-color: var(--status-completed-bg); color: var(--status-completed-text); }
        .status--refused { background-color: #fee2e2; color: #b91c1c; }
        .no-appointments { color: var(--text-light); text-align: center; padding: 40px 0; }
         @media (max-width: 768px) {
            .agenda-container { grid-template-columns: 1fr; }
        }
    `;

    return (
        <>
        <style>{agendaCSS}</style>
        <main className="agenda-main-container">
            <div className="agenda-header">
                <button onClick={onBack} className="font-semibold text-brand-navy hover:text-black">
                    <i className="fa-solid fa-arrow-left mr-2"></i> Voltar
                </button>
                <h1 className="main-title flex-grow text-center">Minha Agenda</h1>
                <div className="w-24"></div>
            </div>
            
            <div className="agenda-container">
                <div className="card calendar-card">
                    <div className="calendar-header">
                        <span className="month">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                        <div className="nav-arrows">
                            <i className="fas fa-chevron-left" onClick={handlePrevMonth}></i>
                            <i className="fas fa-chevron-right" style={{ marginLeft: '8px' }} onClick={handleNextMonth}></i>
                        </div>
                    </div>
                    <div className="weekdays">
                        {dayNames.map(day => <span key={day}>{day}</span>)}
                    </div>
                    <div className="days">
                        {calendarDays.map((d, index) => {
                            const isSelected = !d.isOtherMonth && d.day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear();
                            const className = `day ${d.isOtherMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}`;
                            return <div key={index} className={className} onClick={() => !d.isOtherMonth && handleDayClick(d.day)}>{d.day}</div>;
                        })}
                    </div>
                </div>

                <div className="card schedule-card">
                    <h2>Compromissos para: {formatSelectedDate(selectedDate)}</h2>

                    <div className="appointments-list">
                        {appointmentsForSelectedDay.length > 0 ? (
                            appointmentsForSelectedDay.map((req) => {
                                const status = getStatusForAgenda(req.status);
                                return (
                                    <article key={req.id} className="appointment" onClick={() => onViewDetails(req)}>
                                        <p className="time">{getAppointmentTime(req.requestDate)}</p>
                                        <h3 className="title">{req.description}</h3>
                                        <p className="details">Cliente: {req.clientName} - {req.address}</p>
                                        <span className={`status-tag ${status.className}`}>{status.text}</span>
                                    </article>
                                );
                            })
                        ) : (
                            <p className="no-appointments">Nenhum compromisso para esta data.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
        </>
    );
};

const DashboardView: React.FC<{
    requests: ServiceRequest[];
    setView: (view: ProviderView) => void;
    onViewDetails: (request: ServiceRequest) => void;
    updateRequestStatus: (id: string, status: ServiceRequest['status'], quote?: number, providerEmail?: string) => void;
}> = ({ requests, setView, onViewDetails, updateRequestStatus }) => {
    
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    // --- Calculations for Stat Cards ---
    const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
    
    // Using August 14th as "today" for consistent demo data
    const today = new Date(); 
    
    const servicesToday = requests.filter(r => {
        const requestDate = new Date(r.requestDate);
    // Mostrar na agenda apenas serviços aceitos
    return r.status === 'Aceito' && isSameDay(requestDate, today); // permanece apenas os confirmados na contagem de serviços do dia
    });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const completedThisWeek = requests.filter(r => 
        r.status === 'Finalizado' && new Date(r.requestDate) >= oneWeekAgo && new Date(r.requestDate) <= now
    ).length;
    const completedThisMonth = requests.filter(r => 
        r.status === 'Finalizado' && new Date(r.requestDate) >= oneMonthAgo && new Date(r.requestDate) <= now
    ).length;
    
    // Agenda deve conter apenas serviços aceitos
    const agendaToday = requests
    .filter(r => r.status === 'Aceito' && isSameDay(new Date(r.requestDate), today))
        .sort((a,b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());

    // Novos pedidos: solicitações pendentes para hoje
    const pendingToday = requests
        .filter(r => r.status === 'Pendente' && isSameDay(new Date(r.requestDate), today))
        .sort((a,b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());
    
    return (
        <main className="max-w-7xl mx-auto p-6">
            {isBannerVisible && (
                <div className="bg-brand-beige/30 border border-brand-beige/50 text-brand-navy px-6 py-4 rounded-xl relative flex items-start gap-4 mt-8" role="alert">
                    <i className="fa-solid fa-circle-info text-xl text-brand-navy/80 mt-1"></i>
                    <div>
                        <strong className="font-bold">Novidades na Plataforma!</strong>
                        <p className="block sm:inline text-sm mt-1">Atualizamos nossos termos de serviço e adicionamos novas funcionalidades para gerenciar sua agenda. Confira as novidades!</p>
                    </div>
                    <button 
                        onClick={() => setIsBannerVisible(false)}
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        aria-label="Fechar"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                <StatCard icon="fas fa-calendar-check" title="Serviços para Hoje" color="text-brand-blue" onClick={() => setView('today-services')}>
                     <div className="text-3xl md:text-4xl font-bold text-gray-800">{servicesToday.length}</div>
                </StatCard>
                <StatCard icon="fas fa-comment-dots" title="Mensagens" color="text-green-500" onClick={() => setView('messages')}>
                    <div className="text-3xl md:text-4xl font-bold text-gray-800">0</div>
                </StatCard>
                <StatCard icon="fas fa-star" title="Avaliação" color="text-yellow-500" onClick={() => setView('public-profile')}>
                    <div className="text-3xl md:text-4xl font-bold text-gray-800">N/A</div>
                </StatCard>
                <StatCard icon="fas fa-check-circle" title="Serviços Concluídos" color="text-brand-muted-blue">
                    <div className="flex gap-6 mt-1">
                        <div>
                            <div className="text-2xl md:text-3xl font-semibold text-gray-800">{completedThisMonth}</div>
                            <div className="text-xs text-gray-500">no Mês</div>
                        </div>
                        <div>
                            <div className="text-2xl md:text-3xl font-semibold text-gray-800">{completedThisWeek}</div>
                            <div className="text-xs text-gray-500">na Semana</div>
                        </div>
                    </div>
                </StatCard>
            </div>
            
            {/* Seção de novos pedidos pendentes */}
            <h2 className="text-xl font-medium text-brand-navy mt-16 mb-6">Novos pedidos ({pendingToday.length})</h2>
            <div className="flex flex-col gap-4">
                {pendingToday.length > 0 ? pendingToday.map((req) => (
                    <div key={req.id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="w-full sm:w-auto">
                            <div className="text-sm text-gray-500">{new Date(req.requestDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
                            <div className="font-semibold text-brand-navy">{req.category}</div>
                            <div className="text-sm text-gray-600 truncate">Cliente: {req.clientName} — {req.address}</div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button onClick={() => onViewDetails(req)} className="px-3 py-2 rounded bg-brand-blue text-white text-sm w-full sm:w-auto">Ver / Orçar</button>
                            <button onClick={() => updateRequestStatus(req.id, 'Recusado')} className="px-3 py-2 rounded bg-red-100 text-red-700 text-sm w-full sm:w-auto">Recusar</button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500">Nenhum novo pedido para hoje.</p>
                    </div>
                )}
            </div>

            {/* Agenda: apenas serviços aceitos */}
            <h2 className="text-xl font-medium text-brand-navy mt-16 mb-6">Agenda de Hoje ({today.toLocaleDateString('pt-BR')})</h2>
            <div className="flex flex-col gap-4">
                {agendaToday.length > 0 ? agendaToday.map((req) => (
                    <AppointmentCard key={req.id} time={new Date(req.requestDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})} request={req} onViewDetails={() => onViewDetails(req)} />
                )) : (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500">Nenhum compromisso para hoje.</p>
                    </div>
                )}
            </div>

            <h2 className="text-xl font-medium text-brand-navy mt-16 mb-6">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <a 
                    href="https://eusoumanoelnetto.github.io/apresentacao-geek/apresentacao-geek-ini/index.html" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block bg-white border border-gray-200 rounded-xl text-center cursor-pointer transition-transform transform hover:-translate-y-1 hover:shadow-xl overflow-hidden h-full"
                >
                    <img src="https://raw.githubusercontent.com/eusoumanoelnetto/apresentacao-geek/refs/heads/main/assets/capa-preview.png" alt="Banner do Portfólio Geek" className="w-full h-auto"/>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-2 text-brand-navy">Meu Portfólio Geek</h3>
                        <p className="text-base text-brand-muted-blue leading-relaxed">Conheça minha apresentação interativa e minhas habilidades.</p>
                    </div>
                </a>
                <ActionCard icon="far fa-calendar-alt" title="Gerenciar Agenda" description="Visualize e organize seus compromissos" onClick={() => setView('agenda')} />
                <ActionCard icon="far fa-comments" title="Mensagens" description="Responda às mensagens dos clientes" onClick={() => setView('messages')} />
            </div>
        </main>
    );
};

const QuotesView: React.FC<{ requests: ServiceRequest[]; setView: (view: ProviderView) => void; onViewDetails: (request: ServiceRequest) => void; isFilteredView?: boolean; }> = ({ requests, setView, onViewDetails, isFilteredView = false }) => (
    <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6 text-brand-navy">{isFilteredView ? "Serviços para Hoje" : "Todos os Orçamentos"}</h1>
        <div className="flex flex-col gap-4">
            {requests.length > 0 ? (
                requests.map(req => (
                    <AppointmentCard key={req.id} request={req} onViewDetails={() => onViewDetails(req)} />
                ))
            ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">Nenhum serviço encontrado.</p>
                </div>
            )}
        </div>
    </div>
);

const MessagesView: React.FC<{ setView: (view: ProviderView) => void; }> = ({ setView }) => (
    <div className="max-w-7xl mx-auto p-6">
         <h1 className="text-2xl font-semibold mb-6 text-brand-navy">Mensagens</h1>
        <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">Nenhuma conversa encontrada.</p>
        </div>
    </div>
);

const allServices = [
    { name: 'Montagem de Móveis', iconClass: 'fas fa-couch' },
    { name: 'Reparos Gerais', iconClass: 'fas fa-tools' },
    { name: 'Elétrica', iconClass: 'fas fa-bolt' },
    { name: 'Hidráulica', iconClass: 'fas fa-tint' },
    { name: 'Pintura', iconClass: 'fas fa-paint-roller' },
    { name: 'Manutenção Geral', iconClass: 'fas fa-home' },
    { name: 'Informática', iconClass: 'fas fa-desktop' },
    { name: 'CFTV', iconClass: 'fas fa-video' },
];

const ProviderProfileView: React.FC<{
    currentUser: User;
    setView: (view: ProviderView) => void;
    onLogout: () => void;
    requests: ServiceRequest[];
}> = ({ currentUser, setView, onLogout, requests }) => {
    
    const completedServices = requests.filter(r => r.status === 'Finalizado').length;
    const totalRevenue = requests
        .filter(r => r.status === 'Finalizado' && r.quote)
        .reduce((sum, r) => sum + r.quote!, 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const serviceToIcon: { [key: string]: string } = allServices.reduce((acc, service) => {
        acc[service.name] = service.iconClass;
        return acc;
    }, {} as { [key: string]: string });

    return (
        <div id="view-profile-page">
            <div className="card">
                <div className="profile-header">
                    <div className="avatar">
                        {currentUser.profilePictureBase64 ? 
                            <img src={`data:image/jpeg;base64,${currentUser.profilePictureBase64}`} alt="Avatar" className="avatar-img" />
                            : <i className="fas fa-user-cog"></i>
                        }
                    </div>
                    <h1 className="name">{currentUser.name}</h1>
                    <p className="since">Prestador desde 2023</p>
                    <div className="actions">
                        <button className="btn btn-red" onClick={() => setView('edit-profile')}>Editar Perfil</button>
                        <button className="btn btn-secondary" onClick={onLogout}>Sair</button>
                    </div>
                </div>

                <div className="profile-body">
                    <h3>Informações Pessoais</h3>
                    <div className="info-item"><i className="far fa-envelope"></i> {currentUser.email}</div>
                    <div className="info-item"><i className="fas fa-phone"></i> {currentUser.phone}</div>
                    <div className="info-item"><i className="fas fa-map-marker-alt"></i> {currentUser.cep}</div>
                    
                    <h3>Estatísticas</h3>
                    <div className="stat-item"><span>Serviços realizados:</span><span className="value">{completedServices}</span></div>
                    <div className="stat-item"><span>Avaliação média:</span><span className="value"><i className="fas fa-star"></i> N/A</span></div>
                    <div className="stat-item"><span>Faturamento total:</span><span className="value green">{formatCurrency(totalRevenue)}</span></div>

                    <h3>Serviços Oferecidos</h3>
                    <div className="services-tags">
                        {currentUser.services?.map(service => (
                            <div key={service} className="tag">
                                <i className={serviceToIcon[service] || 'fas fa-cog'}></i> {service}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditProfileView: React.FC<{
    currentUser: User;
    onSave: (updatedUser: User) => void;
    onCancel: () => void;
    setView: (view: ProviderView) => void;
}> = ({ currentUser, onSave, onCancel, setView }) => {
    const [formData, setFormData] = useState<User>(currentUser);
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(currentUser.services || []));
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        currentUser.profilePictureBase64 ? `data:image/jpeg;base64,${currentUser.profilePictureBase64}` : null
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        // Map id to formData key
        const keyMap: { [key: string]: keyof User } = {
            'nome-completo': 'name',
            'telefone': 'phone',
            'cep': 'cep'
        };
        const key = keyMap[id];
        if (key) {
           setFormData(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleServiceToggle = (serviceName: string) => {
        const newSelected = new Set(selectedServices);
        if (newSelected.has(serviceName)) {
            newSelected.delete(serviceName);
        } else {
            newSelected.add(serviceName);
        }
        setSelectedServices(newSelected);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatarPreview(result);
                setFormData(prev => ({ ...prev, profilePictureBase64: result.split(',')[1] || null }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        onSave({ ...formData, services: Array.from(selectedServices) });
    };

    return (
        <div id="edit-profile-page">
            <div className="card">
                <h1>Editar Perfil</h1>
                
                <label htmlFor="photo-upload" className="photo-uploader">
                    <div id="avatar-preview">
                         {avatarPreview ? (
                            <img src={avatarPreview} className="avatar-img" alt="Preview" />
                        ) : (
                            <i className="fas fa-user-cog"></i>
                        )}
                    </div>
                    <div className="edit-overlay"><i className="fas fa-camera"></i></div> 
                </label>
                <input type="file" id="photo-upload" className="hidden-file-input" accept="image/*" onChange={handlePhotoChange} />
                
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="input-group">
                        <label htmlFor="nome-completo">Nome Completo</label>
                        <input type="text" id="nome-completo" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">E-mail (não pode ser alterado)</label>
                        <input type="email" id="email" value={formData.email} disabled />
                    </div>
                    <div className="input-group">
                        <label htmlFor="telefone">Telefone</label>
                        <input type="tel" id="telefone" value={formData.phone} onChange={handleInputChange} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="cep">CEP</label>
                        <input type="text" id="cep" value={formData.cep} onChange={handleInputChange} />
                    </div>
                    <div className="input-group">
                        <label>Serviços Oferecidos</label>
                        <div className="services-container">
                            {allServices.map(service => {
                                const isSelected = selectedServices.has(service.name);
                                return (
                                    <div 
                                        key={service.name} 
                                        className={`service-tag ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleServiceToggle(service.name)}
                                    >
                                        <i className={service.iconClass}></i>
                                        <span>{service.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                        <button type="button" className="btn btn-red" onClick={handleSubmit}>Salvar Alterações</button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <button onClick={() => setView('help')} className="font-semibold text-brand-blue hover:underline text-sm">
                        <i className="fas fa-life-ring mr-2"></i>Precisa de Ajuda?
                    </button>
                </div>
            </div>
        </div>
    );
};

const HelpView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
    <div className="max-w-7xl mx-auto p-6">
        <PageHeader onBack={onBack} title="Voltar para Editar Perfil" />
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h1 className="text-3xl font-bold mb-6 text-center text-brand-navy">Central de Ajuda</h1>
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-2 text-brand-navy">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Como atualizo meu perfil?</h3>
                            <p className="text-gray-600">Na página de "Editar Perfil", você pode alterar seu nome, telefone, CEP, foto e os serviços que oferece. Clique em "Salvar Alterações" para aplicar as mudanças.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold">Como vejo novas solicitações de serviço?</h3>
                            <p className="text-gray-600">Novas solicitações de orçamento aparecerão no seu painel principal e na seção "Meus Orçamentos". Você será notificado sobre novos pedidos.</p>
                        </div>
                    </div>
                </div>
                <div className="border-t pt-6">
                    <h2 className="text-xl font-semibold mb-2 text-brand-navy">Ainda precisa de ajuda?</h2>
                     <p className="text-gray-600">
                        Se não encontrou a resposta que procurava, entre em contato com nossa equipe de suporte. Estamos aqui para ajudar a resolver qualquer problema ou dúvida que você tenha.
                    </p>
                    <p className="mt-4 text-gray-600">
                        E-mail de suporte: <a href="mailto:resolveproblemas.eagle@gmail.com" className="text-brand-red font-semibold hover:underline">resolveproblemas.eagle@gmail.com</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
);


const ProviderPage: React.FC<ProviderPageProps> = ({ currentUser, requests, onLogout, updateRequestStatus, updateUser }) => {
  const [view, setView] = useState<ProviderView>('dashboard');
  const [previousView, setPreviousView] = useState<ProviderView>('dashboard');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const ServiceDetailView: React.FC<{
    request: ServiceRequest | null;
    onBack: () => void;
    updateRequestStatus: (id: string, status: ServiceRequest['status'], quote?: number, providerEmail?: string) => void;
  }> = ({ request, onBack, updateRequestStatus }) => {
    const [quote, setQuote] = useState(request?.quote?.toString() || '');
    if (!request) {
      return (
        <div className="max-w-7xl mx-auto p-6">
          <PageHeader onBack={onBack} title="Voltar" />
          <div className="text-center py-20">Nenhum serviço selecionado.</div>
        </div>
      );
    }

    const handleAccept = () => {
      const quoteValue = parseFloat(quote);
      if (isNaN(quoteValue) || quoteValue <= 0) {
    window.dispatchEvent(new CustomEvent('mdac:notify', { detail: { message: 'Por favor, insira um valor de orçamento válido.', type: 'error' } }));
        return;
      }
    // Prestador envia orçamento: muda para 'Orçamento Enviado'; ainda não é 'Aceito'
    updateRequestStatus(request.id, 'Orçamento Enviado', quoteValue, currentUser.email);
      onBack();
    };

    const handleDecline = () => {
    updateRequestStatus(request.id, 'Recusado');
      onBack();
    };
    
    const status = getStatusDetails(request.status);

    return (
      <div className="max-w-7xl mx-auto p-6">
        <PageHeader onBack={onBack} title="Voltar" />
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm overflow-hidden relative">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-1 text-brand-navy">{request.category}</h1>
              <p className="text-gray-500">Solicitado por: {request.clientName}</p>
            </div>
            <span className={`px-4 py-1.5 text-sm font-medium rounded-full ${status.className}`}>{status.text}</span>
          </div>

          <div className="mt-6 border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-3 text-brand-navy">Detalhes da Solicitação</h2>
              <p className="text-gray-600 mb-4">{request.description}</p>
              {request.photoBase64 && (
                <img src={`data:image/jpeg;base64,${request.photoBase64}`} alt="Foto do serviço" className="rounded-lg max-w-xs" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3 text-brand-navy">Informações do Cliente</h2>
              <div className="space-y-2 text-gray-700">
                <p><i className="fas fa-user mr-2 w-4 text-center"></i>{request.clientName}</p>
                <p><i className="fas fa-map-marker-alt mr-2 w-4 text-center"></i>{request.address}</p>
                <p><i className="fas fa-phone mr-2 w-4 text-center"></i>{request.contact}</p>
              </div>
            </div>
          </div>

                    {request.status === 'Pendente' && (
                        <div className="mt-8 border-t pt-8">
                            <h2 className="text-lg font-semibold mb-3 text-brand-navy">Enviar Orçamento</h2>
                            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full min-w-0">
                                <input 
                                    type="number" 
                                    value={quote}
                                    onChange={e => setQuote(e.target.value)}
                                    placeholder="Ex: 150.00" 
                                    className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-base w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-brand-blue min-w-0"
                                />
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto min-w-0">
                                    <button onClick={handleAccept} className="px-5 py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto text-center whitespace-normal break-words">Enviar Orçamento</button>
                                    <button onClick={handleDecline} className="px-5 py-3 rounded-lg font-semibold bg-brand-red text-white hover:opacity-90 w-full sm:w-auto">Recusar</button>
                                </div>
                            </div>
                        </div>
                    )}
        </div>
      </div>
    );
  };
  

  const handleViewDetails = (request: ServiceRequest) => {
    setPreviousView(view);
    setSelectedRequest(request);
    setView('service-detail');
  };

    // Abrir detalhe quando receber evento global (ex: popup manda para ver pedido específico)
    React.useEffect(() => {
        const handler = (e: any) => {
            const id = e?.detail?.id as string | undefined;
            if (!id) return;
            const found = requests.find(r => r.id === id);
            if (found) handleViewDetails(found);
        };
        window.addEventListener('mdac:viewRequest', handler as EventListener);
        return () => window.removeEventListener('mdac:viewRequest', handler as EventListener);
    }, [requests, view]);

  const renderContent = () => {
    switch (view) {
            case 'dashboard':
                return <DashboardView requests={requests} setView={setView} onViewDetails={handleViewDetails} updateRequestStatus={updateRequestStatus} />;
      case 'quotes':
        return <QuotesView requests={requests} setView={setView} onViewDetails={handleViewDetails} />;
      case 'today-services':
        const today = new Date();
        const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
        const todayRequests = requests.filter(r => {
            const requestDate = new Date(r.requestDate);
            return (r.status === 'Aceito' || r.status === 'Pendente' || r.status === 'Orçamento Enviado') && isSameDay(requestDate, today);
        });
        return <QuotesView requests={todayRequests} setView={setView} onViewDetails={handleViewDetails} isFilteredView={true} />;
      case 'messages':
        return <MessagesView setView={setView} />;
      case 'profile':
        return <ProviderProfileView currentUser={currentUser} setView={setView} onLogout={onLogout} requests={requests} />;
      case 'edit-profile':
        return <EditProfileView 
                  currentUser={currentUser} 
                  onSave={(updatedUser) => {
                      updateUser(updatedUser);
                      setView('profile');
                  }}
                  onCancel={() => setView('profile')}
                  setView={setView}
              />;
      case 'service-detail':
        return <ServiceDetailView 
                  request={selectedRequest} 
                  onBack={() => setView(previousView)} 
                  updateRequestStatus={updateRequestStatus}
                />;
      case 'public-profile':
        return <ProviderPublicProfile currentUser={currentUser} onBack={() => setView('dashboard')} requests={requests} />;
      case 'clients':
          // Placeholder for Clients view
          return (
            <div className="max-w-7xl mx-auto p-6">
              <PageHeader onBack={() => setView('dashboard')} title="Voltar" />
              <div className="text-center py-20">Página de Clientes em construção.</div>
            </div>
          );
      case 'agenda':
        return <AgendaView requests={requests} onBack={() => setView('dashboard')} onViewDetails={handleViewDetails} />;
      case 'help':
        return <HelpView onBack={() => setView('edit-profile')} />;
            default:
                return <DashboardView requests={requests} setView={setView} onViewDetails={handleViewDetails} updateRequestStatus={updateRequestStatus} />;
    }
  };
  
  return (
    <div className="bg-[#f9fafb] text-brand-navy min-h-screen flex flex-col">
       <style>{profilePageStyles}</style>
       <ProviderHeader setView={setView} />
       <main id="provider-profile-container" className="pt-4 pb-8 flex-grow">
        {renderContent()}
       </main>
    </div>
  );
};

export default ProviderPage;