import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function CompilersOverview() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Compilers: Overview and Key Concepts</h1>

        <h2>What is a Compiler?</h2>
        <p>
          A compiler translates source code written in a high-level language
          into lower-level code, typically machine code or an intermediate
          representation. Compilers perform lexical analysis, parsing,
          semantic analysis, optimization, and code generation. Learning
          compiler design gives insight into how languages work and how
          performance is achieved.
        </p>

        <h2>Compilation Stages</h2>
        <p>
          Typical stages include lexical analysis (tokenizing input), parsing
          (building a syntax tree), semantic analysis (type checking and
          symbol resolution), optimization (improving performance while
          preserving semantics), and code generation (producing assembly or
          bytecode). Each stage has distinct algorithms and data structures
          associated with it.
        </p>

        <h2>Intermediate Representations</h2>
        <p>
          Intermediate representations (IR) such as three-address code or
          SSA (Static Single Assignment) form facilitate optimizations.
          Optimizations like constant folding, dead code elimination,
          inlining, and loop transformations operate on the IR.
        </p>

        <h2>Optimization Trade-Offs</h2>
        <p>
          Compiler optimizations can improve speed or reduce size, but they
          may increase compilation time or complicate debugging. Many modern
          compilers offer optimization levels (e.g., -O0 to -O3) to tune this
          trade-off.
        </p>

        <h2>Garbage Collection &amp; Runtime</h2>
        <p>
          For managed languages, runtime components like garbage collectors
          reclaim memory automatically. Compiler writers must design the
          runtime interface and generate code that cooperates with the
          runtime system for tasks like exception handling and memory
          allocation.
        </p>

        <h2>Practical Learning</h2>
        <p>
          Build a small compiler or interpreter (e.g., for a tiny language) to
          learn concepts hands-on. Use parser generators (ANTLR, Bison) or
          write recursive-descent parsers. Explore open-source compilers like
          LLVM to see industrial-grade design patterns and optimization
          techniques.
        </p>
      </main>
      <Footer />
    </div>
  );
}
