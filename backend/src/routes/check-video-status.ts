import { Router } from 'express';
import db from '../models/database';

export const checkVideoStatusRouter = Router();

checkVideoStatusRouter.get('/', async (req, res) => {
  try {
    const { taskId } = req.query;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'taskId is required'
      });
    }

    // Get task from database
    const task = db.prepare('SELECT * FROM video_generation_tasks WHERE task_id = ?').get(taskId as string) as any;

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: {
        taskId: task.task_id,
        state: task.state,
        task: {
          result_url: task.result_url,
          prompt: task.prompt,
          image_url: task.image_url,
          aspect_ratio: task.aspect_ratio
        },
        createdAt: task.created_at,
        updatedAt: task.updated_at
      }
    });
  } catch (error: any) {
    console.error('Error in check-video-status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
