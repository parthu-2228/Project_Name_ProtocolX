// Optional standalone Express server for users who prefer Express over Next.js API routes
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.EXPRESS_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'What Did I Miss? Standalone Backend',
    privacy: 'Stateless on localhost. No logs stored.',
  });
});

app.listen(PORT, () => {
  console.log(`[Express Backend] Running on http://localhost:${PORT}`);
});
