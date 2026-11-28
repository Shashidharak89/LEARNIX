import { Navbar } from "@/app/components/Navbar";
import AdminGuard from "../AdminGuard";
import PaymentsConsole from "./PaymentsConsole";

export const metadata = {
  title: "Payments | Learnix Admin",
  description: "Create and verify Razorpay Standard Checkout payments.",
};

export default function AdminPaymentsPage() {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        <PaymentsConsole />
      </div>
    </AdminGuard>
  );
}
