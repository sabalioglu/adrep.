import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';

export const generateVideoRouter = Router();

generateVideoRouter.post('/', async (req, res) => {
  try {
    const { prompt, imageUrl, aspectRatio = 'landscape', nFrames = '10' } = req.body;

    if (!prompt || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and imageUrl are required'
      });
    }

    // Create video generation task
    const taskId = `video_${Date.now()}_${uuidv4().substring(0, 8)}`;

    const insertTask = db.prepare(`
      INSERT INTO video_generation_tasks (id, task_id, prompt, image_url, aspect_ratio, state)
      VALUES (?, ?, ?, ?, ?, 'waiting')
    `);

    insertTask.run(uuidv4(), taskId, prompt, imageUrl, aspectRatio);

    // Simulate video generation (in real app, this would call an API)
    setTimeout(() => {
      // Mock: Use a sample video URL
      const resultUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      
      const updateTask = db.prepare(`
        UPDATE video_generation_tasks 
        SET state = 'success', result_url = ?, updated_at = ?
        WHERE task_id = ?
      `);

      updateTask.run(resultUrl, new Date().toISOString(), taskId);
    }, 8000); // Simulate 8 second generation time

    res.json({
      success: true,
      data: {
        taskId,
        message: 'Video generation started'
      }
    });
  } catch (error: any) {
    console.error('Error in generate-video:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
