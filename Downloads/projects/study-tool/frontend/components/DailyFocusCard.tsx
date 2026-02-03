'use client';

interface Task {
  id: string;
  topicId: string;
  topicName: string;
  type: 'learn' | 'review' | 'practice';
  priority: number;
  durationMinutes: number;
  reason: string;
}

interface DailyFocusCardProps {
  tasks: Task[];
  onStartTask: (task: Task) => void;
}

export default function DailyFocusCard({ tasks, onStartTask }: DailyFocusCardProps) {
  // Only show top 3 tasks
  const focusTasks = tasks.slice(0, 3);
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'learn': return '[ LEARN ]';
      case 'review': return '[ REVIEW ]';
      case 'practice': return '[ PRACTICE ]';
      default: return '[ STUDY ]';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'learn': return 'var(--info)';
      case 'review': return 'var(--warning)';
      case 'practice': return 'var(--success)';
      default: return 'var(--text-primary)';
    }
  };

  return (
    <div 
      className="p-4"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div 
            className="text-xs uppercase tracking-wide mb-1"
            style={{ color: 'var(--text-dim)' }}
          >
            [ TODAY'S FOCUS ]
          </div>
          <div 
            className="font-semibold uppercase"
            style={{ color: 'var(--text-primary)' }}
          >
            NEXT 3 TASKS
          </div>
        </div>
      </div>


      {/* Task List */}
      {focusTasks.length === 0 ? (
        <div 
          className="text-center py-8"
          style={{ color: 'var(--text-dim)' }}
        >
          [ NO TASKS FOR TODAY ]
          <br />
          <span className="text-xs">Check back tomorrow or add a study plan</span>
        </div>
      ) : (
        <div className="space-y-3">
          {focusTasks.map((task, index) => (
            <div 
              key={task.id}
              className="p-3 flex items-start gap-3"
              style={{ border: '1px dashed var(--border)' }}
            >
              {/* Priority Number */}
              <div 
                className="w-8 h-8 flex items-center justify-center font-bold"
                style={{ 
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                {index + 1}
              </div>
              
              {/* Task Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="text-xs font-medium"
                    style={{ color: getTypeColor(task.type) }}
                  >
                    {getTypeLabel(task.type)}
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {task.durationMinutes} MIN
                  </span>
                </div>
                <div 
                  className="font-medium uppercase text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {task.topicName}
                </div>
                <div 
                  className="text-xs mt-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {task.reason}
                </div>
              </div>
              
              {/* Start Button */}
              <button
                onClick={() => onStartTask(task)}
                className="px-3 py-2 text-xs font-medium uppercase"
                style={{
                  background: 'var(--active-bg)',
                  color: 'var(--active-text)',
                  border: 'none',
                  cursor: 'crosshair'
                }}
              >
                START →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* See All Link */}
      {tasks.length > 3 && (
        <div 
          className="mt-4 text-center text-xs uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          + {tasks.length - 3} MORE TASKS TODAY
        </div>
      )}
    </div>
  );
}
