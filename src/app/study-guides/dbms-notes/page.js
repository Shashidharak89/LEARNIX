import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function DBMSNotes() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>DBMS Notes: Core Concepts</h1>

        <h2>Introduction</h2>
        <p>
          Database Management Systems (DBMS) are software tools that allow
          users to define, create, maintain, and control access to databases.
          DBMSs enable persistent storage, efficient querying, and structured
          data organization that applications and users rely on.
        </p>

        <h2>Data Models</h2>
        <p>
          Common data models include the relational model (tables), the
          document model (JSON documents), key-value stores, column-family
          stores, and graph databases. The relational model uses tables with
          rows and columns and relies on schemas and SQL for querying.
        </p>

        <h2>Relational Algebra &amp; SQL</h2>
        <p>
          Relational algebra provides a theoretical foundation for querying
          relations. SQL (Structured Query Language) is the practical language
          used with relational databases to perform CRUD operations, joins,
          aggregations, and transactions. Learn SELECT, JOIN, GROUP BY,
          HAVING, and window functions for advanced queries.
        </p>

        <h2>Transactions &amp; ACID</h2>
        <p>
          Transactions group multiple operations into a single unit of work.
          ACID properties—Atomicity, Consistency, Isolation, Durability—ensure
          reliable transaction behavior. Isolation levels (READ COMMITTED,
          REPEATABLE READ, SERIALIZABLE) control concurrency impacts.
        </p>

        <h2>Indexing &amp; Performance</h2>
        <p>
          Indexes (B-trees, hash indexes) speed up data retrieval but add
          storage and update overhead. Understanding query plans and using
          proper indexing strategies is crucial for scalable applications.
        </p>

        <h2>Normalization</h2>
        <p>
          Normalization reduces redundancy and improves data integrity by
          organizing attributes into related tables. Normal forms (1NF, 2NF,
          3NF) are guidelines to design efficient schemas while balancing
          complexity and performance.
        </p>

        <h2>Practical Tips</h2>
        <ul>
          <li>Model your data according to access patterns, not only entities.</li>
          <li>Use transactions for multi-step updates that must be atomic.</li>
          <li>Monitor slow queries and use EXPLAIN to optimize them.</li>
          <li>Consider NoSQL when you need flexible schema or massive scale.</li>
        </ul>

        <h2>Further Reading</h2>
        <p>
          Practice by building small apps with PostgreSQL or MySQL, and
          explore NoSQL options like MongoDB for document storage and Neo4j
          for graph problems. Reading the documentation and working through
          real queries will strengthen database skills.
        </p>
        <h2>Backup, Replication &amp; Scaling</h2>
        <p>
          For production systems, plan backups and replication. Backups
          protect against data loss; replication provides redundancy and
          read-scaling. Consider master-slave or multi-master replication
          strategies, and use replication for high availability and disaster
          recovery. Horizontal scaling (sharding) can be used when single-node
          capacity is insufficient, but it increases architectural complexity.
        </p>

        <h2>Security &amp; Access Control</h2>
        <p>
          Secure databases by using least-privilege principles, strong
          authentication, and encrypted connections (TLS). Sanitize inputs to
          prevent SQL injection and use parameterized queries or prepared
          statements. Monitor access logs and set up alerts for suspicious
          activity.
        </p>
      </main>
      <Footer />
    </div>
  );
}
