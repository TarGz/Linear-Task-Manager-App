import { useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import './TaskForm.css';

function TaskForm({ projectId, onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const priorities = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      priority,
      projectId
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
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

          <div className="form-row">
            <div className="form-group">
              <div className="date-input-container">
                <input
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={formatDate(dueDate)}
                  readOnly
                  className="date-display"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                />
                <Calendar size={16} className="date-icon" />
                {showDatePicker && (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setShowDatePicker(false);
                    }}
                    className="date-picker"
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <div className="priority-select">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="priority-dropdown"
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="dropdown-icon" />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary add-task-btn"
              disabled={!title.trim()}
            >
              Add Task
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