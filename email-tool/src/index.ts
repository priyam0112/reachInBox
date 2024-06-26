import { Queue } from 'bullmq';
import 'dotenv/config';

const emailQueue = new Queue('emailQueue');

emailQueue.add('fetchAndCategorize', {});
