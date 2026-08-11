function StudentCard({
  student,
  onDelete,
}) {
  const { id, name, department, cgpa, isActive } = student;

  return (
    <div className="student-card">
      <h3>{name}</h3>

      <p>Department: {department}</p>

      <p>CGPA: {cgpa}</p>

      
      <p>
        Status: {isActive ? "Active" : "Inactive"}
      </p>

      
      {isActive && <span> ✓ Currently Active</span>}

      
      <p>
        {
          (() => {
            if (cgpa >= 3.75) {
              return "Excellent Student";
            }

            if (cgpa >= 3.00) {
              return "Good Student";
            }

            return "Needs Improvement";
          })()
        }
      </p>

      <button onClick={() => onDelete(id)}>
        Delete
      </button>
    </div>
  );
}

export default StudentCard;