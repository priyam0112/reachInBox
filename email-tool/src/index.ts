import { Queue } from 'bullmq';
import 'dotenv/config';
import logger from './logger';
import { emailQueue } from './tasks/emailTasks'; 

logger.info('Application starting...');

// const emailQueue = new Queue('emailQueue');

emailQueue.add('fetchAndCategorize', {});
