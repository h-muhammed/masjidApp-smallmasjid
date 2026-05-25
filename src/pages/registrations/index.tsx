import { useGetRegistrationRequests } from "@/api/registrationApi";
import GoBackButton from "@/components/GoBackButton";
import { RegistrationStatus } from "@/types/types";
import { useFirebase } from "@/contexts/firebaseContext";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const tabs: { key: RegistrationStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

import { Timestamp } from "firebase/firestore";

const formatDate = (ts?: Timestamp) =>
  ts ? ts.toDate().toLocaleString() : "—";

const RegistrationsList: NextPage = () => {
  const [tab, setTab] = useState<RegistrationStatus | "all">("pending");
  const { user, loading } = useFirebase();
  const router = useRouter();

  const statusFilter = tab === "all" ? undefined : tab;
  const { data: requests = [], isLoading } =
    useGetRegistrationRequests(statusFilter);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-bars loading-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <GoBackButton />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
            <p className="text-sm text-slate-500">
              Review member applications and approve into areas
            </p>
          </div>
        </div>

        <div className="tabs tabs-boxed bg-white border border-slate-200 mb-6 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tab ${tab === t.key ? "tab-active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No registrations in this tab.
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm">
                  <th>Name</th>
                  <th>NIC</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="font-medium">{req.name}</td>
                    <td className="text-sm">{req.NIC}</td>
                    <td className="text-sm">{req.contactNo}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          req.status === "pending"
                            ? "badge-warning"
                            : req.status === "approved"
                              ? "badge-success"
                              : "badge-error"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="text-sm text-slate-500">
                      {formatDate(req.submittedAt)}
                    </td>
                    <td>
                      <Link
                        href={`/registrations/${req.id}`}
                        className="btn btn-sm btn-ghost text-main"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationsList;
