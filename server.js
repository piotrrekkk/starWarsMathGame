const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', game: 'Gwiezdna Akademia Matematyki', version: '1.0.0' });
});

// Fallback to index.html for single-page app routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Gwiezdna Akademia Matematyki działa na http://localhost:${PORT}`);
  console.log(`Dostępne na komputerach, tabletach i smartfonach.`);
});
