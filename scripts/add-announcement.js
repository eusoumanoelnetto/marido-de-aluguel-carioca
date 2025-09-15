// Script para adicionar uma notificação ao announcements.json
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/announcements.json');

function addNotification({ id, title, message, date, isUrgent = false, target = 'all' }) {
  let announcements = [];
  if (fs.existsSync(filePath)) {
    announcements = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  announcements.push({ id, title, message, date, isUrgent, target });
  // Manter apenas as últimas 50
  if (announcements.length > 50) announcements = announcements.slice(-50);
  fs.writeFileSync(filePath, JSON.stringify(announcements, null, 2));
  console.log('Notificação adicionada:', { id, title, message, date, isUrgent, target });
}

// Exemplo de uso:
// node add-announcement.js "id" "Título" "Mensagem" "2025-09-15" true "all"
if (require.main === module) {
  const [id, title, message, date, isUrgent, target] = process.argv.slice(2);
  if (!id || !title || !message || !date) {
    console.log('Uso: node add-announcement.js "id" "Título" "Mensagem" "YYYY-MM-DD" [isUrgent] [target]');
    process.exit(1);
  }
  addNotification({
    id,
    title,
    message,
    date,
    isUrgent: isUrgent === 'true',
    target: target || 'all',
  });
}

module.exports = addNotification;
