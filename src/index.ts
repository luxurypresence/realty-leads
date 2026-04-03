import express, { Request, Response } from 'express';
import cors from 'cors';
import LeadService from './services/LeadService.js';
import { routeInquiry } from './services/LeadRouterService.js';
import { processBatch } from './services/BatchIngestionService.js';
import { startEventPoller } from './services/EventDeliveryService.js';
import multer from 'multer';
import type { ApiResponse, Lead } from './types/lead.js';
import type { InboundInquiry, RoutingResult, BatchResult } from './types/router.js';

const app = express();
const PORT = process.env['PORT'] || 4000;

// Initialize the lead service
const leadService = new LeadService();

const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// GET /leads endpoint
app.get('/leads', (_: Request, res: Response) => {
  try {
    const result = leadService.find();
    
    const response: ApiResponse<Lead[]> = {
      success: true,
      data: result,
      count: result.length
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiResponse<never> = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(errorResponse);
  }
});

// POST /leads/route — AI-powered lead routing
app.post('/leads/route', async (req: Request, res: Response) => {
  try {
    const inquiry: InboundInquiry = req.body;
    const result = await routeInquiry(inquiry);

    const response: ApiResponse<RoutingResult> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiResponse<never> = {
      success: false,
      error: 'Routing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});

// POST /leads/batch — CSV batch ingestion with AI routing
app.post('/leads/batch', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const uploadedBy = req.body.uploadedBy || 'unknown';
    const result = await processBatch(req.file.buffer, uploadedBy);

    const response: ApiResponse<BatchResult> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    const errorResponse: ApiResponse<never> = {
      success: false,
      error: 'Batch processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});

// Health check endpoint
app.get('/health', (_: Request, res: Response) => {
  const response: ApiResponse<{ message: string; timestamp: string }> = {
    success: true,
    data: {
      message: 'Server is running',
      timestamp: new Date().toISOString()
    }
  };

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
  console.log(`📊 GET /leads - Get all leads`);
  console.log(`🤖 POST /leads/route - Route an inbound inquiry`);
  console.log(`📦 POST /leads/batch - Batch import leads from CSV`);
  console.log(`💚 GET /health - Health check endpoint`);

  // Start the event delivery background poller
  startEventPoller();
}); 