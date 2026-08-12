function TaskItem({ task, onToggle }) {
  return (
    <li
      className={task.completed ? "task-item completed" : "task-item"}
      onClick={() => onToggle(task.id)}
    >
      <span className="task-checkbox">
        {task.completed ? "☑" : "☐"}
      </span>

      <span className="task-title">
        {task.title}
      </span>
    </li>
  );
}

export default TaskItem;