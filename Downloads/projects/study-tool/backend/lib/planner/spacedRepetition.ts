/**
 * Spaced Repetition Algorithm
 * Based on SM-2 algorithm for optimal review scheduling
 */

export interface ReviewSchedule {
  nextReviewDate: Date;
  interval: number; // days until next review
  easeFactor: number;
}

export interface TopicMasteryData {
  averageScore: number;
  practiceCount: number;
  lastPracticed: Date | null;
  masteryScore: number;
}

/**
 * Calculate next review date using spaced repetition
 * @param mastery - Current topic mastery data
 * @param performanceScore - Latest quiz score (0-1)
 * @returns Review schedule with next date and interval
 */
export function calculateNextReview(
  mastery: TopicMasteryData,
  performanceScore: number
): ReviewSchedule {
  const today = new Date();
  
  // Initial ease factor (2.5 is standard for SM-2)
  let easeFactor = 2.5;
  
  // Adjust ease factor based on performance
  if (performanceScore < 0.6) {
    easeFactor = 1.3; // Struggling - review sooner
  } else if (performanceScore < 0.8) {
    easeFactor = 2.0; // Moderate - normal spacing
  } else {
    easeFactor = 2.5; // Mastered - longer intervals
  }
  
  // Calculate interval based on practice count and performance
  let interval: number;
  
  if (mastery.practiceCount === 0) {
    // First review
    interval = 1;
  } else if (mastery.practiceCount === 1) {
    // Second review
    interval = performanceScore >= 0.6 ? 3 : 1;
  } else {
    // Subsequent reviews - use spaced repetition
    const previousInterval = mastery.lastPracticed 
      ? Math.floor((today.getTime() - new Date(mastery.lastPracticed).getTime()) / (1000 * 60 * 60 * 24))
      : 3;
    
    if (performanceScore < 0.6) {
      // Reset to short interval if struggling
      interval = 1;
    } else {
      // Increase interval based on ease factor
      interval = Math.round(previousInterval * easeFactor);
      
      // Cap maximum interval at 30 days
      interval = Math.min(interval, 30);
    }
  }
  
  // Calculate next review date
  const nextReviewDate = new Date(today);
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  return {
    nextReviewDate,
    interval,
    easeFactor
  };
}

/**
 * Determine if a topic needs review based on last practice date
 * @param lastPracticed - Last practice date
 * @param averageScore - Average performance score
 * @returns true if topic should be reviewed
 */
export function needsReview(lastPracticed: Date | null, averageScore: number): boolean {
  if (!lastPracticed) return true;
  
  const today = new Date();
  const daysSinceLastPractice = Math.floor(
    (today.getTime() - new Date(lastPracticed).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Determine review threshold based on mastery
  let reviewThreshold: number;
  
  if (averageScore < 0.6) {
    reviewThreshold = 1; // Review daily if struggling
  } else if (averageScore < 0.8) {
    reviewThreshold = 3; // Review every 3 days
  } else {
    reviewThreshold = 7; // Review weekly if mastered
  }
  
  return daysSinceLastPractice >= reviewThreshold;
}

/**
 * Prioritize topics for review based on urgency
 * @param topics - Array of topics with mastery data
 * @returns Sorted array with most urgent topics first
 */
export function prioritizeTopics(
  topics: Array<{ id: string; name: string; mastery: TopicMasteryData }>
): Array<{ id: string; name: string; priority: number }> {
  return topics
    .map(topic => {
      let priority = 0;
      
      // Higher priority for lower scores
      priority += (1 - topic.mastery.averageScore) * 100;
      
      // Higher priority for topics not practiced recently
      if (topic.mastery.lastPracticed) {
        const daysSince = Math.floor(
          (Date.now() - new Date(topic.mastery.lastPracticed).getTime()) / (1000 * 60 * 60 * 24)
        );
        priority += daysSince * 5;
      } else {
        priority += 1000; // Never practiced - highest priority
      }
      
      return {
        id: topic.id,
        name: topic.name,
        priority
      };
    })
    .sort((a, b) => b.priority - a.priority);
}
