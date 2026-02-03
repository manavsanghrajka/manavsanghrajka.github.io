import { StudyPlan, StudyDay, StudyTask } from './generateStudyPlan';

export interface TestResult {
  id: string;
  topic: string;
  score: number;
  date: Date;
}

/**
 * Adjusts the study plan based on test results
 * If score is low (<70%), we add more review time for that topic
 * If score is high (>=85%), we can reduce time or move on
 */
export function adjustPlanForResults(
  plan: StudyPlan,
  testResults: TestResult[]
): StudyPlan {
  if (testResults.length === 0) {
    return plan;
  }

  // Group results by topic
  const topicScores: Record<string, number[]> = {};
  testResults.forEach(result => {
    if (!topicScores[result.topic]) {
      topicScores[result.topic] = [];
    }
    topicScores[result.topic].push(result.score);
  });

  // Calculate average score per topic
  const topicAverages: Record<string, number> = {};
  Object.keys(topicScores).forEach(topic => {
    const scores = topicScores[topic];
    topicAverages[topic] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  // 1. Detect Missed Tasks and push them forward
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const missedTasks: StudyTask[] = [];
  const futureDays = plan.days.filter(day => {
      const d = new Date(day.date);
      if (d < today && !day.isRestDay) {
          // Check for incomplete tasks in the past
          day.tasks.forEach(t => {
              if (!(t as any).completed) {
                  missedTasks.push(t);
              }
          });
          return false; // Old day
      }
      return true; // Today or future
  });

  // Add missed tasks to today
  if (missedTasks.length > 0) {
      const todayPlan = futureDays.find(d => new Date(d.date).getTime() === today.getTime());
      if (todayPlan && !todayPlan.isRestDay) {
          todayPlan.tasks = [...missedTasks, ...todayPlan.tasks];
      }
  }

  // 2. Adjust tasks in the plan based on scores
  const adjustedDays = futureDays.map(day => {
    if (day.isRestDay) return day;

    const adjustedTasks = day.tasks.map(task => {
      const avgScore = topicAverages[task.topic.toLowerCase()];
      
      if (avgScore !== undefined) {
        // If score is low, increase time allocation
        if (avgScore < 70) {
          return {
            ...task,
            durationMinutes: Math.floor(task.durationMinutes * 1.3), // 30% more time
            type: 'review' as const // Change to review if it was practice
          };
        }
      }

      return task;
    });

    return { ...day, tasks: adjustedTasks };
  });

  // 3. Add extra review days for poorly performing topics
  const weakTopics = Object.keys(topicAverages).filter(
    topic => topicAverages[topic] < 60
  );

  if (weakTopics.length > 0) {
    // Find first available day (today or future) and add review task
    for (let i = 0; i < adjustedDays.length; i++) {
      const day = adjustedDays[i];
      if (!day.isRestDay && new Date(day.date) >= today) {
        weakTopics.forEach(topic => {
          if (!day.tasks.some(t => t.topic.toLowerCase() === topic.toLowerCase() && t.type === 'review')) {
            day.tasks.push({
              type: 'review',
              topic: `Review ${topic}`,
              durationMinutes: 30,
              resources: [{ title: `Review materials for ${topic}`, url: '#' }]
            });
          }
        });
        break;
      }
    }
  }

  return {
    ...plan,
    days: adjustedDays
  };
}
