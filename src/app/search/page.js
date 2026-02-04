import { Suspense } from "react";
import { Navbar } from "../components/Navbar";
import UsersPage from "./UsersPage";
import UsersPageSkeleton from "./UsersPageSkeleton";

export default function Search() {
    return (
        <div>
            <Navbar />
            <Suspense fallback={<UsersPageSkeleton />}>
                <UsersPage />
            </Suspense>
        </div>
    );
}
