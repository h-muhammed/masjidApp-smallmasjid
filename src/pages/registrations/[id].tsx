import {
  checkNicExists,
  useApproveRegistration,
  useGetRegistrationRequest,
  useRejectRegistration,
} from "@/api/registrationApi";
import { useGetAreas } from "@/api/areaApi";
import GoBackButton from "@/components/GoBackButton";
import { useFirebase } from "@/contexts/firebaseContext";
import { buildMemberUid, calculateNextRefNo } from "@/utils/refNoUtils";
import { Timestamp } from "firebase/firestore";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { UserType } from "@/types/types";

async function fetchAreaUsers(areaCode: string): Promise<UserType[]> {
  const usersCollection = collection(firestore, "users");
  const byAreaId = query(usersCollection, where("areaId", "==", areaCode));
  const byAreaCode = query(usersCollection, where("areaCode", "==", areaCode));
  const [snapId, snapCode] = await Promise.all([
    getDocs(byAreaId),
    getDocs(byAreaCode),
  ]);
  const map = new Map<string, UserType>();
  [...snapId.docs, ...snapCode.docs].forEach((d) => {
    map.set(d.id, d.data() as UserType);
  });
  return Array.from(map.values());
}

const formatTs = (ts?: Timestamp) =>
  ts ? ts.toDate().toLocaleString() : "—";

const RegistrationDetail: NextPage = () => {
  const router = useRouter();
  const id = router.query.id as string;
  const { user, loading: authLoading } = useFirebase();
  const { data: request, isLoading } = useGetRegistrationRequest(id);
  const { data: areas = [] } = useGetAreas();

  const [assignedAreaId, setAssignedAreaId] = useState("");
  const [subscription, setSubscription] = useState("");
  const [refNo, setRefNo] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [nicWarning, setNicWarning] = useState<string | null>(null);

  const selectedArea = areas.find((a) => a.areaId === assignedAreaId);
  const areaCode = selectedArea?.areaCode || assignedAreaId;

  const { data: areaUsers = [] } = useQuery({
    queryKey: ["approve-area-users", areaCode],
    queryFn: () => fetchAreaUsers(areaCode),
    enabled: !!areaCode && request?.status === "pending",
  });

  const suggestedRefNo = useMemo(
    () => calculateNextRefNo(areaUsers),
    [areaUsers]
  );

  const previewUid = useMemo(() => {
    if (!areaCode || !refNo) return "";
    return buildMemberUid(areaCode, refNo);
  }, [areaCode, refNo]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (selectedArea && request?.status === "pending") {
      setRefNo((prev) => prev || calculateNextRefNo(areaUsers));
    }
  }, [selectedArea, areaUsers, request?.status]);

  useEffect(() => {
    if (!request?.NIC || request.status !== "pending") return;
    checkNicExists(request.NIC).then((exists) => {
      setNicWarning(
        exists
          ? "A member with this NIC already exists in the system."
          : null
      );
    });
  }, [request?.NIC, request?.status]);

  const { mutate: approve, isPending: approving } = useApproveRegistration();
  const { mutate: reject, isPending: rejecting } = useRejectRegistration();

  const handleApprove = () => {
    if (!request?.id || !user?.email) return;
    if (!assignedAreaId || !subscription.trim()) {
      setToast("Please select an area and enter subscription amount.");
      return;
    }

    approve(
      {
        requestId: request.id,
        assignedAreaId,
        assignedAreaCode: areaCode,
        subscription: subscription.trim(),
        refNo: refNo.trim() || suggestedRefNo,
        adminNotes,
        reviewedBy: user.email,
      },
      {
        onSuccess: (result) => {
          setToast(`Approved. Member ID: ${result.uid}`);
          setTimeout(() => router.push("/registrations"), 2000);
        },
        onError: (err: Error) => setToast(err.message),
      }
    );
  };

  const handleReject = () => {
    if (!request?.id || !user?.email) return;
    if (!rejectionReason.trim()) {
      setToast("Please enter a rejection reason.");
      return;
    }
    reject(
      {
        requestId: request.id,
        rejectionReason,
        reviewedBy: user.email,
        adminNotes,
      },
      {
        onSuccess: () => {
          setToast("Registration rejected.");
          setTimeout(() => router.push("/registrations"), 1500);
        },
        onError: (err: Error) => setToast(err.message),
      }
    );
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-bars loading-lg" />
      </div>
    );
  }

  if (isLoading || !request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-bars loading-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <GoBackButton />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{request.name}</h1>
            <span
              className={`badge badge-sm mt-1 ${
                request.status === "pending"
                  ? "badge-warning"
                  : request.status === "approved"
                    ? "badge-success"
                    : "badge-error"
              }`}
            >
              {request.status}
            </span>
          </div>
          <Link href="/registrations" className="text-sm text-slate-500 hover:underline">
            Back to list
          </Link>
        </div>

        {toast && (
          <div className="alert mb-4 text-sm">
            <span>{toast}</span>
          </div>
        )}

        {nicWarning && request.status === "pending" && (
          <div className="alert alert-warning mb-4 text-sm">
            <span>{nicWarning}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 mb-6">
          <section>
            <h2 className="text-xs font-semibold uppercase text-slate-400 mb-3">
              Head of household
            </h2>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-slate-500">Name</dt>
              <dd>{request.name}</dd>
              <dt className="text-slate-500">NIC</dt>
              <dd>{request.NIC}</dd>
              <dt className="text-slate-500">Contact</dt>
              <dd>{request.contactNo}</dd>
              <dt className="text-slate-500">Address</dt>
              <dd className="col-span-1">{request.address}</dd>
              {request.email ? (
                <>
                  <dt className="text-slate-500">Email</dt>
                  <dd>{request.email}</dd>
                </>
              ) : null}
              {request.notes ? (
                <>
                  <dt className="text-slate-500">Notes</dt>
                  <dd>{request.notes}</dd>
                </>
              ) : null}
              <dt className="text-slate-500">Submitted</dt>
              <dd>{formatTs(request.submittedAt)}</dd>
            </dl>
          </section>

          {request.spouse?.name ? (
            <section>
              <h2 className="text-xs font-semibold uppercase text-slate-400 mb-3">
                Spouse
              </h2>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-slate-500">Name</dt>
                <dd>{request.spouse.name}</dd>
                {request.spouse.NIC ? (
                  <>
                    <dt className="text-slate-500">NIC</dt>
                    <dd>{request.spouse.NIC}</dd>
                  </>
                ) : null}
                {request.spouse.contactNo ? (
                  <>
                    <dt className="text-slate-500">Contact</dt>
                    <dd>{request.spouse.contactNo}</dd>
                  </>
                ) : null}
                {request.spouse.occupation ? (
                  <>
                    <dt className="text-slate-500">Occupation</dt>
                    <dd>{request.spouse.occupation}</dd>
                  </>
                ) : null}
              </dl>
            </section>
          ) : null}

          {request.children?.length > 0 ? (
            <section>
              <h2 className="text-xs font-semibold uppercase text-slate-400 mb-3">
                Children ({request.children.length})
              </h2>
              <div className="space-y-3">
                {request.children.map((child, i) => (
                  <div
                    key={i}
                    className="border border-slate-100 rounded-lg p-3 text-sm"
                  >
                    <p className="font-medium">{child.name}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {[child.grade, child.school, child.dateOfBirth, child.gender]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {request.status === "pending" ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-900">Admin decision</h2>

            <div>
              <label className="label text-sm">Assign to area *</label>
              <select
                className="select select-bordered w-full"
                value={assignedAreaId}
                onChange={(e) => {
                  setAssignedAreaId(e.target.value);
                  setRefNo("");
                }}
              >
                <option value="">Select area</option>
                {areas.map((a) => (
                  <option key={a.areaId} value={a.areaId}>
                    {a.shortName} ({a.areaId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label text-sm">Subscription (Rs.) *</label>
              <input
                className="input input-bordered w-full"
                placeholder="e.g. 500"
                value={subscription}
                onChange={(e) => setSubscription(e.target.value)}
              />
            </div>

            <div>
              <label className="label text-sm">
                Reference no. (suggested: {suggestedRefNo})
              </label>
              <input
                className="input input-bordered w-full"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder={suggestedRefNo}
              />
              {previewUid ? (
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Member ID: {previewUid}
                </p>
              ) : null}
            </div>

            <div>
              <label className="label text-sm">Admin notes</label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="label text-sm">Rejection reason (if rejecting)</label>
              <input
                className="input input-bordered w-full"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                className="btn !bg-main !text-white border-0"
                disabled={approving || rejecting}
                onClick={handleApprove}
              >
                {approving ? "Approving…" : "Approve & add member"}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-error"
                disabled={approving || rejecting}
                onClick={handleReject}
              >
                {rejecting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
            <p>Reviewed: {formatTs(request.reviewedAt)}</p>
            {request.reviewedBy ? <p>By: {request.reviewedBy}</p> : null}
            {request.approvedUserId ? (
              <p className="mt-2">
                Member:{" "}
                <Link
                  href={`/user/${request.approvedUserId}`}
                  className="text-main font-medium underline"
                >
                  {request.approvedUserId}
                </Link>
              </p>
            ) : null}
            {request.rejectionReason ? (
              <p className="mt-2 text-red-600">
                Reason: {request.rejectionReason}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationDetail;
