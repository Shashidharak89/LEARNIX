import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function AlgorithmsIntro() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Algorithms: An Introduction</h1>

        <h2>What is an Algorithm?</h2>
        <p>
          An algorithm is a finite set of well-defined instructions for
          solving a class of problems. Algorithms are evaluated based on
          correctness, efficiency (time and space complexity), and
          simplicity. Studying algorithms helps you make better engineering
          choices and design performant systems.
        </p>

        <h2>Algorithm Design Techniques</h2>
        <p>
          Common techniques include divide and conquer, greedy algorithms,
          dynamic programming, backtracking and branch-and-bound. Each
          technique is suited to different problem types—for example, dynamic
          programming excels in problems with overlapping subproblems.
        </p>

        <h2>Sorting and Searching</h2>
        <p>
          Sorting is a fundamental problem; efficient algorithms include
          quicksort, mergesort, and heapsort. Searching in sorted data often
          uses binary search for O(log n) performance. Learning these
          primitives provides building blocks for more complex algorithms.
        </p>

        <h2>Graph Algorithms</h2>
        <p>
          Graphs are versatile models for networks. Breadth-first search and
          depth-first search are core traversals. Shortest path algorithms
          such as Dijkstra's and Bellman-Ford solve weighted path problems.
          Minimum spanning tree algorithms (Kruskal, Prim) are used for
          network design problems.
        </p>

        <h2>Complexity and Trade-offs</h2>
        <p>
          Algorithm selection often involves trade-offs between time,
          space, and implementational complexity. For real-world systems,
          consider I/O behavior, cache locality, and parallelizability in
          addition to asymptotic complexity.
        </p>

        <h2>Practice Strategies</h2>
        <p>
          Work on varied problems, read others' solutions, and practice
          writing structured proofs or explanations alongside code. Building
          intuition and recognizing patterns will dramatically accelerate
          your learning curve.
        </p>
        <h2>Worked Example</h2>
        <p>
          Consider the problem of finding two numbers that sum to a target
          value. A naive O(n^2) solution checks all pairs. Using a hash map
          you can achieve O(n) time by storing seen values and checking the
          complement during a single pass. Such patterns (use of maps for
          lookups) are common and worth memorizing.
        </p>

        <h2>Balancing Theory and Practice</h2>
        <p>
          Study algorithm proofs and correctness, but also implement and
          profile them. Practical constraints such as input distribution,
          memory limits and constant factors often influence real-world
          choices more than asymptotic differences for moderate input sizes.
        </p>
      </main>
      <Footer />
    </div>
  );
}
