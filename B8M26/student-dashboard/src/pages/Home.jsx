import StudentForm from "../components/StudentForm";
import StudentList from "../components/StudentList";

function Home({
  students,
  onAddStudent,
  onDelete,
}) {
  return (
    <main>
      <StudentForm onAddStudent={onAddStudent} />

      <StudentList
        students={students}
        onDelete={onDelete}
      />
    </main>
  );
}

export default Home;