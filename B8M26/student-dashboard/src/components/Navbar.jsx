function Navbar({ totalStudents }) {
  return (
    <nav>
      <h1>Student Dashboard</h1>

      <p>Total Students: {totalStudents}</p>
    </nav>
  );
}

export default Navbar;