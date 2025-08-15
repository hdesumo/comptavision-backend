// src/lib/license.js
function generateLicenseKey(prefix = 'CV') {
  const year = new Date().getFullYear();
  const rnd = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${rnd()}-${rnd()}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

module.exports = { generateLicenseKey, addDays };

