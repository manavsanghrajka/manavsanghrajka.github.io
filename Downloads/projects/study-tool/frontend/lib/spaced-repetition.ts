/**
 * Spaced Repetition Algorithm (SM-2 based)
 * 
 * This module implements an adaptive scheduling algorithm that:
 * 1. Uses spaced repetition to optimize review timing
 * 2. Adjusts intervals based on performance
 * 3. Prioritizes topics based on mastery and due dates
 */

export interface TopicMastery {
  topicId: string;
  topicName: string;
  masteryLevel: number;      // 0-100 percentage
  lastReviewed: Date | null;
  nextReviewDate: Date;
  easeFactor: number;        // SM-2 ease factor (default 2.5)
  interval: number;          // Current interval in days
  repetitions: number;       // Number of successful reviews
  lapses: number;           // Number of failed reviews
}

export interface StudyTask {
  topicId: string;
  topicName: string;
  type: 'learn' | 'review' | 'practice';
  priority: number;          // Higher = more urgent
  durationMinutes: number;
  dueDate: Date;
  reason: string;           // Why this task is scheduled
}

// SM-2 Algorithm Constants
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const INITIAL_INTERVAL = 1;  // 1 day
const GRADUATING_INTERVAL = 6; // 6 days after 3 successful reviews

/**
 * Calculate the next review interval using SM-2 algorithm
 */
export function calculateNextInterval(
  currentInterval: number,
  easeFactor: number,
  quality: number // 0-5, where 0=complete failure, 5=perfect
): { interval: number; easeFactor: number } {
  // Adjust ease factor based on quality
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  let newInterval: number;
  
  if (quality < 3) {
    // Failed review - reset interval
    newInterval = 1;
  } else if (currentInterval === 1) {
    // First successful review
    newInterval = 1;
  } else if (currentInterval <= INITIAL_INTERVAL) {
    // Second review
    newInterval = GRADUATING_INTERVAL;
  } else {
    // Subsequent reviews
    newInterval = Math.round(currentInterval * newEaseFactor);
  }

  return {
    interval: newInterval,
    easeFactor: newEaseFactor
  };
}

/**
 * Convert a quiz score (0-100) to SM-2 quality rating (0-5)
 */
export function scoreToQuality(score: number): number {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  if (score >= 30) return 1;
  return 0;
}

/**
 * Calculate priority score for a topic
 * Higher score = more urgent to study
 */
export function calculatePriority(mastery: TopicMastery, examDate: Date): number {
  const now = new Date();
  const examDaysRemaining = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  let priority = 0;
  
  // Factor 1: Overdue topics get highest priority (0-40 points)
  const daysOverdue = Math.ceil((now.getTime() - mastery.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysOverdue > 0) {
    priority += Math.min(40, daysOverdue * 5);
  }
  
  // Factor 2: Low mastery topics get higher priority (0-30 points)
  priority += (100 - mastery.masteryLevel) * 0.3;
  
  // Factor 3: Topics with high lapse count need attention (0-15 points)
  priority += Math.min(15, mastery.lapses * 3);
  
  // Factor 4: Urgency based on exam proximity (0-15 points)
  if (examDaysRemaining < 7) {
    priority += 15;
  } else if (examDaysRemaining < 14) {
    priority += 10;
  } else if (examDaysRemaining < 30) {
    priority += 5;
  }
  
  return Math.round(priority);
}

/**
 * Determine the type of study task based on mastery level
 */
export function determineTaskType(mastery: TopicMastery): 'learn' | 'review' | 'practice' {
  if (mastery.repetitions === 0) {
    return 'learn';
  } else if (mastery.masteryLevel >= 70) {
    return 'practice';
  } else {
    return 'review';
  }
}

/**
 * Generate a reason string for why a topic is scheduled
 */
export function generateTaskReason(mastery: TopicMastery): string {
  const now = new Date();
  const daysOverdue = Math.ceil((now.getTime() - mastery.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (mastery.repetitions === 0) {
    return 'New topic - never studied';
  }
  
  if (daysOverdue > 0) {
    return `Due for review (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue)`;
  }
  
  if (mastery.masteryLevel < 50) {
    return 'Low mastery - needs reinforcement';
  }
  
  if (mastery.lapses > 2) {
    return 'Frequently forgotten - extra practice needed';
  }
  
  return 'Scheduled review to maintain retention';
}

/**
 * Generate an adaptive study schedule for a given time budget
 */
export function generateAdaptiveSchedule(
  topicMasteries: TopicMastery[],
  examDate: Date,
  minutesAvailable: number,
  taskDuration: number = 30 // Default 30 minutes per task
): StudyTask[] {
  const tasks: StudyTask[] = [];
  const now = new Date();
  
  // Calculate priority for each topic
  const prioritizedTopics = topicMasteries
    .map(mastery => ({
      mastery,
      priority: calculatePriority(mastery, examDate),
      taskType: determineTaskType(mastery)
    }))
    .sort((a, b) => b.priority - a.priority);
  
  let remainingMinutes = minutesAvailable;
  
  for (const { mastery, priority, taskType } of prioritizedTopics) {
    if (remainingMinutes < taskDuration) break;
    
    // Skip topics that aren't due yet (unless we have extra time)
    const isDue = mastery.nextReviewDate <= now;
    const isUrgent = priority > 20;
    
    if (!isDue && !isUrgent && remainingMinutes < minutesAvailable * 0.5) {
      continue;
    }
    
    tasks.push({
      topicId: mastery.topicId,
      topicName: mastery.topicName,
      type: taskType,
      priority,
      durationMinutes: taskDuration,
      dueDate: mastery.nextReviewDate,
      reason: generateTaskReason(mastery)
    });
    
    remainingMinutes -= taskDuration;
  }
  
  return tasks;
}

/**
 * Update mastery after completing a study task
 */
export function updateMasteryAfterReview(
  mastery: TopicMastery,
  score: number // 0-100 quiz score
): TopicMastery {
  const quality = scoreToQuality(score);
  const { interval, easeFactor } = calculateNextInterval(
    mastery.interval,
    mastery.easeFactor,
    quality
  );
  
  const now = new Date();
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  // Update mastery level using exponential moving average
  const learningRate = 0.3;
  const newMasteryLevel = Math.round(
    mastery.masteryLevel * (1 - learningRate) + score * learningRate
  );
  
  return {
    ...mastery,
    masteryLevel: Math.max(0, Math.min(100, newMasteryLevel)),
    lastReviewed: now,
    nextReviewDate,
    easeFactor,
    interval,
    repetitions: quality >= 3 ? mastery.repetitions + 1 : mastery.repetitions,
    lapses: quality < 3 ? mastery.lapses + 1 : mastery.lapses
  };
}

/**
 * Initialize mastery for a new topic
 */
export function initializeTopicMastery(topicId: string, topicName: string): TopicMastery {
  return {
    topicId,
    topicName,
    masteryLevel: 0,
    lastReviewed: null,
    nextReviewDate: new Date(), // Due immediately
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: INITIAL_INTERVAL,
    repetitions: 0,
    lapses: 0
  };
}
