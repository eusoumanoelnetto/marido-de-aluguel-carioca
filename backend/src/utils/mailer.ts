import emailjs from 'emailjs-com';

export async function sendUserDeletedEmail(to: string, name?: string) {
  // Configure os IDs do EmailJS via variáveis de ambiente
  const serviceID = process.env.EMAILJS_SERVICE_ID;
  const templateID = process.env.EMAILJS_TEMPLATE_ID;
  const userID = process.env.EMAILJS_USER_ID;

  if (!serviceID || !templateID || !userID) {
    throw new Error('Configuração do EmailJS ausente.');
  }

  const templateParams = {
    to_email: to,
    to_name: name || '',
    message: `Olá${name ? ' ' + name : ''},\n\nSua conta foi excluída do sistema Marido de Aluguel. Caso tenha dúvidas ou ache que isso foi um engano, entre em contato com o suporte.`
  };

  await emailjs.send(serviceID, templateID, templateParams, userID);
}
