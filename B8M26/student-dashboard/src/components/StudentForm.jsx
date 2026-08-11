import { useState } from "react";

function StudentForm({ onAddStudent }) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [cgpa, setCgpa] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const newStudent = {
      id: Date.now(),
      name: name,
      department: department,
      cgpa: Number(cgpa),
      isActive: true,
    };

    onAddStudent(newStudent);

    setName("");
    setDepartment("");
    setCgpa("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Student</h2>

      <input
        type="text"
        placeholder="Student Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <input
        type="text"
        placeholder="Department"
        value={department}
        onChange={(event) =>
          setDepartment(event.target.value)
        }
      />

      <input
        type="number"
        step="0.01"
        placeholder="CGPA"
        value={cgpa}
        onChange={(event) => setCgpa(event.target.value)}
      />

      <button type="submit">
        Add Student
      </button>
    </form>
  );
}

export default StudentForm;