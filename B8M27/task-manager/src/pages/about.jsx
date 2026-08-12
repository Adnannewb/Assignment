function About() {
  return (
    <section className="page">
      <div className="container">
        <h1>About Task Manager</h1>

        <p>
          This is a Mini Task Manager application built using React.
        </p>

        <h2>Technologies Used</h2>

        <ul className="about-list">
          <li>React</li>
          <li>Vite</li>
          <li>React Router</li>
          <li>Context API</li>
          <li>useState</li>
          <li>useRef</li>
          <li>useEffect</li>
          <li>JavaScript</li>
          <li>CSS</li>
        </ul>

        <h2>Features</h2>

        <ul className="about-list">
          <li>Add new tasks</li>
          <li>Toggle task completion</li>
          <li>Fetch tasks from an API</li>
          <li>Loading state</li>
          <li>Light and dark theme</li>
          <li>React Router navigation</li>
        </ul>
      </div>
    </section>
  );
}

export default About;