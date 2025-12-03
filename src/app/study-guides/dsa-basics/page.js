import Footer from "../../components/Footer";
import { Navbar } from "../../components/Navbar";

export default function DSABasics() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Data Structures & Algorithms: Basics</h1>

        <h2>Introduction</h2>
        <p>
          Data Structures and Algorithms (DSA) form the foundation of computer
          science and software engineering. DSA helps you organize data in
          efficient ways and craft algorithms that operate on that data with
          predictable performance. Mastery of DSA improves problem-solving and
          is critical for interviews, building scalable systems, and writing
          efficient code.
        </p>

        <h2>Core Data Structures</h2>
        <p>
          Fundamental data structures include arrays, linked lists, stacks,
          queues, trees, graphs, hash tables, and heaps. Each structure has
          trade-offs in terms of memory usage, access time, and ease of
          insertion/deletion. Choosing the right structure depends on the
          operations you need and performance constraints. For example,
          arrays provide O(1) random access but O(n) insertion in the middle,
          while linked lists provide O(1) insertion at known positions but
          O(n) access time. Trees (binary trees, AVL, red-black trees)
          provide efficient ordered operations and are commonly used in
          databases and indexes. Graphs model relationships and networks and
          can be represented using adjacency lists for sparse graphs or
          adjacency matrices for dense graphs.
        </p>

        <h2>Key Algorithms</h2>
        <p>
          Algorithms are step-by-step procedures to perform tasks. Key
          algorithm categories include sorting (quicksort, mergesort,
          heapsort), searching (binary search), graph algorithms (BFS, DFS,
          Dijkstra's, Bellman-Ford), and dynamic programming techniques
          (memoization and tabulation). Divide and conquer methods break
          larger problems into subproblems, while greedy algorithms make a
          locally optimal choice hoping to reach a global optimum. Dynamic
          programming is essential for optimization problems where overlapping
          subproblems exist.
        </p>

        <h2>Algorithm Analysis</h2>
        <p>
          Analyzing algorithms with Big-O gives a high-level view of their
          performance as input grows. Consider best, average and worst-case
          complexities and also analyze space usage. For example, quicksort
          has average-case O(n log n) time but worst-case O(n^2) unless
          randomized pivot selection is used. Merge sort guarantees O(n log n)
          time but requires additional memory for merging.
        </p>

        <h2>Big-O Notation</h2>
        <p>
          Big-O provides an abstraction to describe an algorithm's worst-case
          performance relative to input size. Common complexities are O(1),
          O(log n), O(n), O(n log n), O(n^2). Aim for lower-order
          complexities when working with large datasets.
        </p>

        <h2>Practical Tips</h2>
        <ul>
          <li>Start by understanding problem constraints before selecting a data structure.</li>
          <li>Practice common patterns: two-pointers, sliding window, divide and conquer, backtracking.</li>
          <li>Implement data structures from scratch to deepen understanding.</li>
          <li>Use visualizations to see how structures change during operations.</li>
          <li>Write tests for edge cases, and use complexity analysis to justify choices.</li>
        </ul>

        <h2>Learning Path</h2>
        <p>
          A recommended path: start with arrays and strings, then move to
          linked lists, stacks, queues, hash tables, trees and graphs. Learn
          basic sorting and searching, then progress to graph algorithms and
          dynamic programming. Reinforce learning by solving progressively
          harder problems and reviewing solutions to understand different
          approaches.
        </p>

        <h2>Further Study</h2>
        <p>
          Build projects and solve problems on platforms like LeetCode or
          HackerRank to sharpen skills. Combine theoretical study with
          practical implementation for best results. Consider reading classic
          textbooks such as "Introduction to Algorithms" (CLRS) and online
          course materials to deepen understanding.
        </p>

        <h2>Further Study</h2>
        <p>
          Build projects and solve problems on platforms like LeetCode or
          HackerRank to sharpen skills. Combine theoretical study with
          practical implementation for best results.
        </p>
      </main>
      <Footer />
    </div>
  );
}
