import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import './TaskForm.css';

function TaskForm({ projectId, task, onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Default due date to today in local timezone (YYYY-MM-DD) for new tasks
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });

  // Initialize form with existing task data if editing
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      if (task.dueDate) {
        // Convert task due date to YYYY-MM-DD format
        const taskDate = new Date(task.dueDate);
        taskDate.setMinutes(taskDate.getMinutes() - taskDate.getTimezoneOffset());
        setDueDate(taskDate.toISOString().split('T')[0]);
      }
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      ...(task && { id: task.id }), // Include task ID if editing
      title: title.trim(),
      description: description.trim(),
      dueDate,
      projectId: projectId || task?.project?.id
    });
  };


  return (
    <div className="task-form-overlay">
      <div className="task-form-container card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="task-title-input"
              autoFocus
            />
          </div>

          {description !== undefined && (
            <div className="form-group">
              <textarea
                placeholder="Add description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="task-description-input"
                rows={3}
              />
            </div>
          )}

          <div className="form-group">
            <div className="date-input-container">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="date-input"
                placeholder="Select due date"
              />
              <Calendar size={16} className="date-icon" />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary add-task-btn"
              disabled={!title.trim()}
            >
              {task ? 'Update Task' : 'Add Task'}
            </button>
            <button
              type="button"
              className="btn btn-secondary cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskForm;
