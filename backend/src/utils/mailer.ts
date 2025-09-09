import emailjs from 'emailjs-com';

export async function sendUserDeletedEmail(to: string, name?: string) {
  // Configure os IDs do EmailJS via variáveis de ambiente
  const serviceID = process.env.EMAILJS_SERVICE_ID;
  const templateID = process.env.EMAILJS_TEMPLATE_ID;
  const userID = process.env.EMAILJS_USER_ID;

  if (!serviceID || !templateID || !userID) {
    throw new Error('Configuração do EmailJS ausente.');
  }

  const geekMsg = `Olá${name ? ' ' + name : ''},\n\nSua conta foi deletada do nosso sistema.\n\nMas calma, não foi Thanos que estalou os dedos! 😅\n\nSe você acha que isso foi um bug digno do Matrix ou um erro do multiverso, entre em contato com nosso suporte Jedi e vamos restaurar o equilíbrio na Força!\n\nLive long and prosper!\nEquipe Marido de Aluguel`;

  const templateParams = {
    to_email: to,
    to_name: name || '',
    message: geekMsg
  };

  await emailjs.send(serviceID, templateID, templateParams, userID);
}
