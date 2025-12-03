import Footer from "../../../components/Footer";
import { Navbar } from "../../../components/Navbar";

export default function NetworkingIntro() {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1>Computer Networking: Introduction</h1>

        <h2>Overview</h2>
        <p>
          Computer networking connects devices to enable communication and
          resource sharing. Networks can range from small local area networks
          (LANs) to global wide area networks (WANs) such as the Internet.
        </p>

        <h2>OSI &amp; TCP/IP Models</h2>
        <p>
          The OSI model divides networking into seven layers: physical,
          data link, network, transport, session, presentation, and
          application. The TCP/IP model is a widely used practical model with
          four layers: link, internet, transport, and application.
        </p>

        <h2>Key Protocols</h2>
        <p>
          Important protocols include Ethernet at the link layer, IP at the
          network layer, TCP and UDP at the transport layer, and HTTP/HTTPS at
          the application layer. TCP provides reliable, ordered delivery;
          UDP provides low-latency, connectionless communication.
        </p>

        <h2>Routing &amp; Switching</h2>
        <p>
          Switching happens within local networks to forward frames between
          devices, while routing forwards packets across networks using
          routing tables and algorithms like OSPF and BGP. Understanding
          routing is essential for designing scalable networks.
        </p>

        <h2>Network Security</h2>
        <p>
          Network security involves firewalls, VPNs, encryption (TLS), and
          intrusion detection/prevention. Secure design and regular audits
          help protect assets and maintain confidentiality and integrity of
          data in transit.
        </p>

        <h2>Practical Exercises</h2>
        <p>
          Practice by setting up a home lab with routers and switches (or use
          simulation tools). Capture packets with Wireshark, configure NAT
          and DHCP, and experiment with routing protocols to deepen your
          understanding.
        </p>
        <h2>DNS, HTTP and Web Basics</h2>
        <p>
          DNS (Domain Name System) translates domain names into IP
          addresses. HTTP(S) is the application protocol used by the web.
          Understanding how TLS, certificates and the HTTPS handshake secure
          web traffic is important for modern web systems. Practice by
          inspecting HTTP headers and TLS handshakes using developer tools
          or Wireshark to learn how requests and responses flow end-to-end.
        </p>

        <h2>Further Study</h2>
        <p>
          For deeper learning, study subnetting, CIDR notation, VLANs,
          load balancing, and content delivery networks (CDNs). Real-world
          experience with cloud networking (VPCs, security groups) is also
          highly valuable for systems engineering roles.
        </p>
      </main>
      <Footer />
    </div>
  );
}
