import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function OSOverview() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Operating Systems: Overview</h1>

        <h2>What is an Operating System?</h2>
        <p>
          An Operating System (OS) is system software that manages computer
          hardware and provides services to applications. The OS controls
          resources such as CPU, memory, storage, and input/output devices,
          and provides abstractions that make application development easier.
        </p>

        <h2>Core Responsibilities</h2>
        <p>
          Core responsibilities include process management, memory management,
          file systems, device drivers, and security. Process management
          includes scheduling, context switching, and synchronization. Memory
          management includes virtual memory, paging, segmentation, and
          allocation strategies.
        </p>

        <h2>Processes and Threads</h2>
        <p>
          Processes are instances of executing programs with their own memory
          space. Threads are lightweight execution units within a process
          sharing memory and resources. Modern OSes support multithreading to
          improve responsiveness and throughput.
        </p>

        <h2>Concurrency &amp; Synchronization</h2>
        <p>
          Concurrency involves multiple processes or threads executing
          simultaneously. Synchronization primitives like mutexes, semaphores
          and condition variables prevent race conditions. Understanding
          deadlocks and avoidance strategies (resource ordering, timeout,
          deadlock detection) is crucial for reliable systems.
        </p>

        <h2>File Systems</h2>
        <p>
          File systems manage how data is stored and retrieved. Common file
          system features include hierarchical directories, permissions, and
          journaling for crash recovery. Examples include ext4, NTFS, APFS and
          others. Performance and reliability are important considerations
          when selecting a file system.
        </p>

        <h2>Memory Management</h2>
        <p>
          Virtual memory provides an abstraction that makes programs appear
          to have contiguous memory addresses. Paging and swapping allow
          systems to run programs that exceed physical memory, at the cost of
          potential performance overhead (page faults).
        </p>

        <h2>Practical Study Tips</h2>
        <p>
          Study OS by implementing small kernels or working with projects
          that exercise process scheduling, writing simple shell programs,
          or studying the Linux kernel source. Textbooks such as "Operating
          Systems: Three Easy Pieces" are excellent resources.
        </p>
        <h2>Examples &amp; Exercises</h2>
        <p>
          Try implementing a simple scheduler that simulates Round Robin and
          Priority scheduling with multiple processes and measure response
          times. Experiment with virtual memory by creating a simulation of
          paging and page replacement algorithms like LRU and FIFO. Building
          small utilities (a basic shell, a tiny file system simulator) will
          clarify many OS concepts.
        </p>

        <h2>Real-World Considerations</h2>
        <p>
          Real operating systems must balance performance, compatibility and
          security. Modern systems include kernel modules, device driver
          frameworks, containerization and virtualization layers. Exploring
          containers (Docker) and hypervisors will demonstrate how OS
          concepts scale to cloud infrastructure.
        </p>
      </main>
      <Footer />
    </div>
  );
}
