import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function LinkedLists() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Linked Lists: Concepts and Operations</h1>

        <h2>Overview</h2>
        <p>
          A linked list is a linear data structure where elements are stored
          in nodes and each node points to the next node. Unlike arrays,
          linked lists provide efficient insertions and deletions at known
          positions without contiguous memory allocation.
        </p>

        <h2>Types of Linked Lists</h2>
        <p>
          Common variants include singly linked lists, doubly linked lists,
          and circular linked lists. Singly lists have a next pointer; doubly
          linked lists also have a previous pointer to facilitate two-way
          traversal. Circular lists connect the tail back to the head.
        </p>

        <h2>Basic Operations</h2>
        <p>
          Key operations include insertion, deletion, traversal, searching,
          and reversal. Inserting at the head is O(1); finding a position is
          O(n). Reversing a list in-place is an important interview
          technique that demonstrates pointer manipulation skills.
        </p>

        <h2>Use Cases and Trade-offs</h2>
        <p>
          Linked lists are useful for implementing stacks, queues, adjacency
          lists in graphs, and for systems with frequent insertions and
          deletions. However, they have poor cache locality compared to
          arrays, and random access is O(n).
        </p>

        <h2>Implementation Tips</h2>
        <ul>
          <li>Use sentinel (dummy) nodes to simplify edge cases.</li>
          <li>Carefully manage memory in languages without garbage collection.</li>
          <li>Write unit tests for empty, single-element, and multi-element cases.</li>
        </ul>

        <h2>Practice Exercises</h2>
        <p>
          Implement operations such as adding two numbers represented as
          linked lists, detecting cycles, merging sorted lists, and finding
          the middle node. These problems build confidence with pointer
          manipulation and algorithmic thinking.
        </p>
        <h2>Complexity and Considerations</h2>
        <p>
          Most basic operations on linked lists are O(n) in the worst case for
          search, but insertion at the head or removal when pointer is
          available is O(1). Consider memory overhead for pointers and the
          impact on cache behavior. Understand when arrays or other dynamic
          structures are a better fit.
        </p>

        <h2>Advanced Topics</h2>
        <p>
          Advanced problems include reversing sublists, copying linked lists
          with random pointers, and performing in-place list partitioning.
          Practice these to deepen pointer manipulation skills and edge-case
          handling.
        </p>
      </main>
      <Footer />
    </div>
  );
}
