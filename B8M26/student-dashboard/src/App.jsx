import { useState } from "react";

import Navbar from "./components/Navbar";
import StudentList from "./components/StudentList";
import StudentForm from "./components/StudentForm";
import ErrorBoundary from "./components/ErrorFallback";

import initialStudents from "./data/students";

function App() {
  const [students, setStudents] = useState(initialStudents);

  const addStudent = (student) => {
    setStudents((previousStudents) => [
      ...previousStudents,
      student,
    ]);
  };

  const deleteStudent = (id) => {
    setStudents((previousStudents) =>
      previousStudents.filter(
        (student) => student.id !== id
      )
    );
  };

  return (
    <div>
      <Navbar totalStudents={students.length} />

      <StudentForm onAddStudent={addStudent} />

      <ErrorBoundary>
        <StudentList
          students={students}
          onDelete={deleteStudent}
        />
      </ErrorBoundary>
    </div>
  );
}

export default App;