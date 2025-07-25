import express, { Request, Response } from 'express';
import cors from 'cors';
import LeadService from './services/LeadService.js';
import type { ApiResponse, Lead } from './types/lead.js';

const app = express();
const PORT = process.env['PORT'] || 4000;

// Initialize the lead service
const leadService = new LeadService();

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
  console.log(`💚 GET /health - Health check endpoint`);
}); 