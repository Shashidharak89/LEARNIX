import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function ProcessesThreads() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Processes & Threads: Operating System Concepts</h1>

        <h2>Definitions</h2>
        <p>
          A process is an executing instance of a program with its own memory
          and resources. A thread is the smallest unit of scheduled
          execution—threads within the same process share address space and
          resources, enabling efficient communication but requiring
          synchronization for shared data.
        </p>

        <h2>Context Switching</h2>
        <p>
          The OS performs context switches between processes or threads to
          multiplex the CPU. Context switching saves and restores processor
          state and can be expensive; reducing unnecessary context switches
          improves performance.
        </p>

        <h2>Scheduling</h2>
        <p>
          Scheduling algorithms such as Round Robin, Priority Scheduling,
          and Multilevel Queue determine the order of execution. Preemptive
          scheduling allows the OS to interrupt running tasks, while
          non-preemptive scheduling waits for tasks to yield control.
        </p>

        <h2>Synchronization</h2>
        <p>
          Synchronization primitives (mutexes, semaphores, barriers) control
          access to shared resources and prevent race conditions. Understanding
          atomic operations and memory visibility rules is important for
          writing correct multithreaded programs.
        </p>

        <h2>Deadlocks</h2>
        <p>
          Deadlocks occur when processes hold resources while waiting for
          each other. Techniques to handle deadlocks include prevention,
          avoidance (banker's algorithm), detection and recovery, or simply
          using timeouts and resource ordering.
        </p>

        <h2>Practical Exercises</h2>
        <p>
          Practice by writing multithreaded programs, using synchronization
          primitives to protect shared data. Use tools like Valgrind and
          thread sanitizers to detect data races and memory issues.
        </p>
        <h2>Examples</h2>
        <p>
          Implement producer-consumer patterns using condition variables and
          mutexes, or write a thread pool to manage a set of worker threads
          processing tasks from a queue. These exercises illustrate the need
          for careful locking and the consequences of poor synchronization.
        </p>

        <h2>Debugging Multithreaded Programs</h2>
        <p>
          Debugging concurrent programs requires tools and techniques such as
          deterministic replay, logging with timestamps, and using
          thread-sanitizers to spot data races. Reproducible test harnesses
          reduce flakiness and help isolate concurrency bugs.
        </p>
      </main>
      <Footer />
    </div>
  );
}
