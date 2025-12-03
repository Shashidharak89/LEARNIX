import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function SQLQueries() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>SQL Queries: Practical Guide</h1>

        <h2>Introduction to SQL</h2>
        <p>
          SQL (Structured Query Language) is the standard language for
          interacting with relational databases. Learn SELECT for querying,
          INSERT for adding rows, UPDATE for modifying data, and DELETE for
          removal. SQL also provides DDL statements for schema definition
          and DCL for permissions.
        </p>

        <h2>SELECT and Filtering</h2>
        <p>
          The basic query uses SELECT columns FROM table WHERE conditions to
          filter rows. Use logical operators (AND, OR) and comparison
          operators for precise filtering. ORDER BY sorts results, and LIMIT
          restricts the number of rows returned.
        </p>

        <h2>Joining Tables</h2>
        <p>
          JOINs combine rows from multiple tables using a related column.
          INNER JOIN returns matching rows; LEFT/RIGHT JOIN include unmatched
          rows from one side; FULL OUTER JOIN returns all rows from both
          sides when supported. Understanding join types is crucial for
          correct relational queries.
        </p>

        <h2>Aggregation</h2>
        <p>
          Use aggregate functions like COUNT, SUM, AVG, MIN, MAX with GROUP
          BY to compute summaries across groups. HAVING filters groups after
          aggregation. Window functions (OVER PARTITION BY) provide advanced
          analytics like running totals and rankings.
        </p>

        <h2>Subqueries &amp; Indexes</h2>
        <p>
          Subqueries (nested queries) provide flexibility but can be
          inefficient if misused. Indexes speed up lookups but may slow down
          writes. Use EXPLAIN to analyze query plans and add indexes based on
          filter and join patterns.
        </p>

        <h2>Practical Tips</h2>
        <ul>
          <li>Start by writing queries that return correct results, then
            optimize for performance.</li>
          <li>Use parameterized queries to prevent SQL injection.</li>
          <li>Regularly review slow query logs and tune indexes accordingly.</li>
        </ul>
        <h2>Example Queries</h2>
        <p>
          A typical query to find top students might use aggregation and
          ordering:
        </p>
        <pre>
SELECT student_id, AVG(score) as avg_score
FROM exam_results
GROUP BY student_id
HAVING AVG(score) &gt; 75
ORDER BY avg_score DESC
LIMIT 10;
        </pre>
        <p>
          For joining user profiles and uploads:
        </p>
        <pre>
SELECT u.name, m.title, m.created_at
FROM users u
JOIN materials m ON m.user_id = u.id
WHERE m.visibility = 'public'
ORDER BY m.created_at DESC;
        </pre>
      </main>
      <Footer />
    </div>
  );
}
