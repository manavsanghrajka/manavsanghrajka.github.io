

/* =====================
   GENERIC TYPES
   ===================== */

export type Resource = {
  title: string;
  pages?: string;
  url?: string;
  topic?: string;
  type?: string; 
};

export type TaskType = "learn" | "practice" | "review" | "test";

export type StudyTask = {
  type: TaskType;
  topic: string;
  durationMinutes: number;
  resources: Resource[];
};

export type StudyDay = {
  date: string;
  isRestDay: boolean;
  tasks: StudyTask[];
};

export type StudyPlan = {
  examName: string;
  days: StudyDay[];
};

export interface SyllabusUnit {
  title?: string;
  weight: number;
  topics: string[];
}

export interface Syllabus {
  title: string;
  units: SyllabusUnit[];
}

/* =====================
   MAIN EXPORT (Connects to Server.ts)
   ===================== */

import { getExamByName } from '../database-pg';

/* =====================
   GENERIC TYPES
   ===================== */
// ... (Types remain the same)

/* =====================
   MAIN EXPORT (Connects to Server.ts)
   ===================== */

export const generateStudyPlan = async (examName: string, endDate: Date, minutesPerDay: number = 60): Promise<StudyPlan> => {
    
    // 1. Fetch Exam & Topics from DB
    const exam = await getExamByName(examName);
    
    if (!exam) {
        throw new Error(`Exam '${examName}' not found in database. Please ask admin to import it.`);
    }

    // 2. Construct Syllabus from DB Topics
    // Group topics by unitName
    const unitsMap = new Map<string, SyllabusUnit>();
    const defaultUnitName = "General Topics";

    // Sort topics by order
    const sortedTopics = exam.topics.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    sortedTopics.forEach((t: any) => {
        const uName = t.unitName || defaultUnitName;
        if (!unitsMap.has(uName)) {
            unitsMap.set(uName, {
                title: uName,
                weight: t.weight || 0.1, // This might need smarter aggregation if weight is per topic
                topics: []
            });
        }
        unitsMap.get(uName)!.topics.push(t.name);
    });

    // If weights were per topic, we should sum them up or normalize? 
    // For now assuming the first topic's unit weight or just standard distribution. 
    // Let's refine: If DB doesn't have unit weights, we distribute evenly.
    const units = Array.from(unitsMap.values());
    
    // Normalize weights if needed (simple logic: equal weights if not specified)
    // For MVP we assume the import handled plausible weights or we accept the topic's weight as unit weight proxy.
    
    const syllabus: Syllabus = {
        title: exam.name,
        units: units
    };

    // 3. Create a resolver to find resources (Generic Fallback)
    const genericResolver = (topicName: string, usage: "learn" | "practice") => {
        return [{
            title: `${topicName} (${usage})`,
            url: "#", // In future, fetch from Resource table
            pages: "",
            topic: topicName,
            type: usage
        }];
    };

    // 4. Call the logic function
    return createPlanInternal({
        syllabus: syllabus,
        resourceResolver: genericResolver,
        examDate: endDate,
        startDate: new Date(),
        minutesPerDay: minutesPerDay || 60, 
        restDays: [0] // 0 = Sunday
    });
};

/* =====================
   INTERNAL LOGIC
   ===================== */

function createPlanInternal(options: {
  syllabus: Syllabus;
  resourceResolver: (topic: string, usage: "learn" | "practice") => Resource[];
  examDate: Date;
  startDate?: Date;
  minutesPerDay: number;
  restDays?: number[];
}): StudyPlan {
  const { 
    syllabus,
    resourceResolver,
    examDate, 
    minutesPerDay,
    startDate = new Date(),
    restDays = [0]
  } = options;

  // 1. Calculate Timeline
  const daysUntilExam = Math.max(
    0,
    Math.ceil((examDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  let workableDays = 0;
  for (let i = 0; i < daysUntilExam; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    if (!restDays.includes(d.getDay())) workableDays++;
  }
  const totalAvailableMinutes = workableDays * minutesPerDay;

  // 2. Build Task Queue
  const taskQueue: StudyTask[] = [];
  const addTask = (t: StudyTask) => taskQueue.push(t);

  syllabus.units.forEach((unit, unitIndex) => {
    // Determine Unit Name
    const unitName = (unit as any).name || (unit as any).title || `Unit ${unitIndex + 1}`;

    const unitMinutes = Math.floor(totalAvailableMinutes * unit.weight);
    const reviewTime = Math.floor(unitMinutes * 0.15);
    const studyTime = unitMinutes - reviewTime;

    const rawMinutesPerTopic = Math.floor(studyTime / unit.topics.length);
    const minutesPerTopic = Math.min(minutesPerDay, 60, rawMinutesPerTopic);

    // Add Topic Tasks
    (unit.topics as string[]).forEach((topic) => {
      const learnTime = Math.floor(minutesPerTopic * 0.6);
      const practiceTime = minutesPerTopic - learnTime;

      if (learnTime > 0) {
        addTask({
          type: "learn",
          topic: topic,
          durationMinutes: learnTime,
          resources: resourceResolver(topic, "learn")
        });
      }

      if (practiceTime > 0) {
        addTask({
          type: "practice",
          topic: topic,
          durationMinutes: practiceTime,
          resources: resourceResolver(topic, "practice")
        });
      }
    });

    // Add Unit Review
    if (reviewTime > 0) {
      addTask({
        type: "review",
        topic: `Review ${unitName}`,
        durationMinutes: Math.min(minutesPerDay, 60, reviewTime), 
        resources: [{ title: `Summary Notes for ${unitName}`, url: "check-syllabus" }]
      });
    }

    // Add Practice Exams
    const isHalfway = unitIndex === Math.floor(syllabus.units.length / 2) - 1;
    const isLastUnit = unitIndex === syllabus.units.length - 1;

    if (isHalfway || isLastUnit) { 
      addTask({
        type: "test",
        topic: `Full Practice Exam (${isHalfway ? "Midterm" : "Final"})`,
        durationMinutes: 90, 
        resources: [{ title: "Mock Exam PDF", url: "exam-repository" }]
      });
    }
  });

  // 3. Fill Calendar
  const days: StudyDay[] = [];
  let taskIndex = 0;

  for (let i = 0; i < daysUntilExam; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    // Check Rest Day
    if (restDays.includes(currentDate.getDay())) {
      days.push({
        date: currentDate.toISOString().split("T")[0],
        isRestDay: true,
        tasks: []
      });
      continue;
    }

    // Fill Study Slots
    let remainingMinutes = minutesPerDay;
    const tasksForDay: StudyTask[] = [];

    while (remainingMinutes > 0 && taskIndex < taskQueue.length) {
      const task = taskQueue[taskIndex];

      if (task.durationMinutes <= remainingMinutes) {
        tasksForDay.push(task);
        remainingMinutes -= task.durationMinutes;
        taskIndex++;
      } else {
        // Handle huge tasks
        if (tasksForDay.length === 0 && task.durationMinutes > minutesPerDay) {
           tasksForDay.push(task);
           taskIndex++;
           remainingMinutes = 0;
        } else {
           break; 
        }
      }
    }

    days.push({
      date: currentDate.toISOString().split("T")[0],
      isRestDay: false,
      tasks: tasksForDay
    });

    if (taskIndex >= taskQueue.length) break;
  }

  return {
    examName: syllabus.title,
    days
  };
}