import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function ComputerArchitecture() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Computer Organization & Architecture: Fundamentals</h1>

        <h2>Introduction</h2>
        <p>
          Computer architecture describes the structure and behavior of the
          computer system from a functional perspective. It covers the
          instruction set architecture (ISA), the hardware components, and
          interactions between hardware and software. Understanding
          architecture helps developers write efficient code and design
          systems that make good use of available hardware.
        </p>

        <h2>Instruction Set Architecture (ISA)</h2>
        <p>
          The ISA is the contract between software and hardware. It defines
          supported instructions, data types, registers, addressing modes,
          and memory model. Common ISAs include x86/x64, ARM, and RISC-V.
          Choosing an ISA affects compiler design, performance, and power
          consumption considerations.
        </p>

        <h2>CPU Organization</h2>
        <p>
          Modern CPUs are organized with multiple cores, each containing
          execution units, pipelines, and caches. Pipelining increases
          instruction throughput by overlapping stages (fetch, decode,
          execute). Superscalar architectures can issue multiple
          instructions per cycle; out-of-order execution improves utilization
          by running independent instructions while stalled ones wait for
          data.
        </p>

        <h2>Memory Hierarchy</h2>
        <p>
          Memory hierarchy is key for performance. Registers are fastest,
          followed by multiple levels of cache (L1, L2, L3), main memory
          (DRAM), and persistent storage. Caches exploit temporal and
          spatial locality to reduce average memory access time. Understanding
          cache lines, associativity, and replacement policies helps in
          writing cache-friendly code.
        </p>

        <h2>I/O and Buses</h2>
        <p>
          Input/output devices communicate over buses and interfaces such as
          PCIe. Device controllers manage hardware interactions and DMA
          (Direct Memory Access) enables peripherals to transfer data without
          heavy CPU involvement.
        </p>

        <h2>Parallelism &amp; Multicore</h2>
        <p>
          Modern performance gains come from parallelism. Multicore CPUs
          require concurrent programming techniques. Understanding memory
          consistency models, synchronization primitives and false sharing
          is essential for writing correct and performant multithreaded
          programs.
        </p>

        <h2>Practical Advice</h2>
        <p>
          Learn architecture by reading processor manuals, profiling code,
          and experimenting with low-level languages (C, assembly). Use
          tools like perf, valgrind, and processor simulators to observe
          performance behavior and validate optimization hypotheses.
        </p>
      </main>
      <Footer />
    </div>
  );
}
import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function ComputerArchitecture() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Computer Architecture: Fundamentals</h1>

        <h2>Introduction</h2>
        <p>
          Computer architecture studies the organization and design of computer
          systems. It covers CPU design, instruction sets, memory hierarchy,
          I/O systems, and performance considerations. Understanding
          architecture helps write efficient software and optimize systems.
        </p>

        <h2>CPU and Instruction Set</h2>
        <p>
          The CPU executes instructions defined by an instruction set
          architecture (ISA). CISC and RISC are two ISA philosophies—RISC
          emphasizes simpler instructions that can execute quickly, while
          CISC provides more complex instructions at the cost of
          implementation complexity.
        </p>

        <h2>Memory Hierarchy</h2>
        <p>
          Memory systems are organized in a hierarchy: registers, L1/L2/L3
          caches, main memory, and secondary storage. Caches exploit spatial
          and temporal locality to improve performance. Understanding cache
          behavior impacts algorithm design and data layout.
        </p>

        <h2>Parallelism</h2>
        <p>
          Modern processors support instruction-level, data-level and thread
          level parallelism. Techniques include pipelining, superscalar
          execution, SIMD instructions and multicore architectures. Parallel
          programming models and synchronization are required to leverage
          hardware parallelism effectively.
        </p>

        <h2>I/O and Storage</h2>
        <p>
          I/O systems bridge processors and peripherals. Disk and network
          I/O are often bottlenecks; buffering, caching and asynchronous I/O
          help mitigate latencies. Storage technologies (HDD, SSD, NVMe)
          differ significantly in performance and should be considered when
          designing systems.
        </p>

        <h2>Practical Learning</h2>
        <p>
          Hands-on labs with simulators (e.g., Logisim) or studying CPU
          pipeline diagrams deepen understanding. Benchmark and profile
          programs to observe architecture effects in real systems.
        </p>
      </main>
      <Footer />
    </div>
  );
}
