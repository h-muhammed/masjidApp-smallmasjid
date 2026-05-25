import { firestore } from "@/config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChildFormType,
  FamilyMemberType,
  RegistrationRequestType,
  RegistrationStatus,
  RegistrationSubmitInput,
  SpouseFormType,
  UserType,
} from "@/types/types";
import { createUser } from "@/api/areaApi";
import { buildMemberUid, calculateNextRefNo } from "@/utils/refNoUtils";

const COLLECTION = "registrationRequests";
const FAMILY_COLLECTION = "familyMembers";

export type ApproveRegistrationInput = {
  requestId: string;
  assignedAreaId: string;
  assignedAreaCode: string;
  subscription: string;
  refNo?: string;
  adminNotes?: string;
  reviewedBy: string;
};

const getUsersByAreaCode = async (areaCode: string): Promise<UserType[]> => {
  const usersCollection = collection(firestore, "users");
  const byAreaId = query(usersCollection, where("areaId", "==", areaCode));
  const byAreaCode = query(usersCollection, where("areaCode", "==", areaCode));
  const [snapId, snapCode] = await Promise.all([
    getDocs(byAreaId),
    getDocs(byAreaCode),
  ]);
  const map = new Map<string, UserType>();
  [...snapId.docs, ...snapCode.docs].forEach((d) => {
    map.set(d.id, { ...(d.data() as UserType) });
  });
  return Array.from(map.values()).sort((a, b) =>
    a.refNo.localeCompare(b.refNo, undefined, { numeric: true })
  );
};

export const submitRegistrationRequest = async (
  input: RegistrationSubmitInput
) => {
  const spouse =
    input.spouse?.name?.trim() ?
      {
        name: input.spouse.name.trim(),
        NIC: input.spouse.NIC?.trim() || "",
        contactNo: input.spouse.contactNo?.trim() || "",
        occupation: input.spouse.occupation?.trim() || "",
      }
    : null;

  const children = (input.children || [])
    .filter((c) => c.name?.trim())
    .map((c) => ({
      name: c.name.trim(),
      dateOfBirth: c.dateOfBirth?.trim() || "",
      grade: c.grade?.trim() || "",
      school: c.school?.trim() || "",
      gender: c.gender?.trim() || "",
    }));

  const docRef = await addDoc(collection(firestore, COLLECTION), {
    status: "pending" as RegistrationStatus,
    submittedAt: Timestamp.now(),
    name: input.name.trim(),
    NIC: input.NIC.trim(),
    address: input.address.trim(),
    contactNo: input.contactNo.trim(),
    email: input.email?.trim() || "",
    notes: input.notes?.trim() || "",
    spouse,
    children,
  });

  return docRef.id;
};

const mapRequestDoc = (
  id: string,
  data: Record<string, unknown>
): RegistrationRequestType => ({
  id,
  status: data.status as RegistrationStatus,
  submittedAt: data.submittedAt as Timestamp,
  name: String(data.name ?? ""),
  NIC: String(data.NIC ?? ""),
  address: String(data.address ?? ""),
  contactNo: String(data.contactNo ?? ""),
  email: data.email ? String(data.email) : "",
  notes: data.notes ? String(data.notes) : "",
  spouse: (data.spouse as SpouseFormType | null) ?? null,
  children: (data.children as ChildFormType[]) ?? [],
  assignedAreaId: data.assignedAreaId ? String(data.assignedAreaId) : undefined,
  assignedAreaCode: data.assignedAreaCode
    ? String(data.assignedAreaCode)
    : undefined,
  subscription: data.subscription ? String(data.subscription) : undefined,
  refNo: data.refNo ? String(data.refNo) : undefined,
  reviewedAt: data.reviewedAt as Timestamp | undefined,
  reviewedBy: data.reviewedBy ? String(data.reviewedBy) : undefined,
  adminNotes: data.adminNotes ? String(data.adminNotes) : undefined,
  rejectionReason: data.rejectionReason
    ? String(data.rejectionReason)
    : undefined,
  approvedUserId: data.approvedUserId
    ? String(data.approvedUserId)
    : undefined,
});

export const getRegistrationRequests = async (
  status?: RegistrationStatus
) => {
  const col = collection(firestore, COLLECTION);
  const q = status
    ? query(
        col,
        where("status", "==", status),
        orderBy("submittedAt", "desc")
      )
    : query(col, orderBy("submittedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    mapRequestDoc(d.id, d.data() as Record<string, unknown>)
  );
};

export const getRegistrationRequest = async (id: string) => {
  const snap = await getDoc(doc(firestore, COLLECTION, id));
  if (!snap.exists()) throw new Error("Registration not found");
  return mapRequestDoc(snap.id, snap.data() as Record<string, unknown>);
};

export const getPendingRegistrationCount = async () => {
  const q = query(
    collection(firestore, COLLECTION),
    where("status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const checkNicExists = async (nic: string): Promise<boolean> => {
  const normalized = nic.trim();
  if (!normalized) return false;
  const usersCol = collection(firestore, "users");
  const snap = await getDocs(
    query(usersCol, where("NIC", "==", normalized), limit(1))
  );
  return !snap.empty;
};

const createFamilyMembers = async (
  userId: string,
  registrationRequestId: string,
  spouse: SpouseFormType | null | undefined,
  children: ChildFormType[]
) => {
  const col = collection(firestore, FAMILY_COLLECTION);
  const writes: Promise<unknown>[] = [];

  if (spouse?.name?.trim()) {
    writes.push(
      addDoc(col, {
        userId,
        registrationRequestId,
        relationship: "spouse",
        name: spouse.name.trim(),
        NIC: spouse.NIC?.trim() || "",
        contactNo: spouse.contactNo?.trim() || "",
        occupation: spouse.occupation?.trim() || "",
        createdAt: Timestamp.now(),
      })
    );
  }

  children
    .filter((c) => c.name?.trim())
    .forEach((child) => {
      writes.push(
        addDoc(col, {
          userId,
          registrationRequestId,
          relationship: "child",
          name: child.name.trim(),
          dateOfBirth: child.dateOfBirth?.trim() || "",
          grade: child.grade?.trim() || "",
          school: child.school?.trim() || "",
          gender: child.gender?.trim() || "",
          createdAt: Timestamp.now(),
        })
      );
    });

  await Promise.all(writes);
};

export const approveRegistrationRequest = async (
  input: ApproveRegistrationInput
) => {
  const request = await getRegistrationRequest(input.requestId);
  if (request.status !== "pending") {
    throw new Error("This registration has already been reviewed.");
  }

  const areaUsers = await getUsersByAreaCode(input.assignedAreaCode);
  const refNo =
    input.refNo?.trim() || calculateNextRefNo(areaUsers);
  const uid = buildMemberUid(input.assignedAreaCode, refNo);

  const existingUid = await getDoc(doc(firestore, "users", uid));
  if (existingUid.exists()) {
    throw new Error(`Member ID ${uid} already exists. Choose another ref no.`);
  }

  const headUser: UserType = {
    uid,
    refNo,
    name: request.name,
    NIC: request.NIC,
    address: request.address,
    contactNo: request.contactNo,
    areaCode: input.assignedAreaCode,
    areaId: input.assignedAreaId,
    subscription: input.subscription,
  };

  await createUser(headUser);
  await createFamilyMembers(
    uid,
    input.requestId,
    request.spouse,
    request.children ?? []
  );

  await updateDoc(doc(firestore, COLLECTION, input.requestId), {
    status: "approved",
    assignedAreaId: input.assignedAreaId,
    assignedAreaCode: input.assignedAreaCode,
    subscription: input.subscription,
    refNo,
    reviewedAt: Timestamp.now(),
    reviewedBy: input.reviewedBy,
    adminNotes: input.adminNotes?.trim() || "",
    approvedUserId: uid,
  });

  return { uid, refNo };
};

export const rejectRegistrationRequest = async (
  requestId: string,
  rejectionReason: string,
  reviewedBy: string,
  adminNotes?: string
) => {
  const request = await getRegistrationRequest(requestId);
  if (request.status !== "pending") {
    throw new Error("This registration has already been reviewed.");
  }

  await updateDoc(doc(firestore, COLLECTION, requestId), {
    status: "rejected",
    rejectionReason: rejectionReason.trim(),
    reviewedAt: Timestamp.now(),
    reviewedBy,
    adminNotes: adminNotes?.trim() || "",
  });
};

export const getFamilyMembersByUserId = async (userId: string) => {
  const q = query(
    collection(firestore, FAMILY_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as FamilyMemberType)
  );
};

export const useSubmitRegistration = () => {
  return useMutation({
    mutationFn: submitRegistrationRequest,
  });
};

export const useGetRegistrationRequests = (status?: RegistrationStatus) => {
  return useQuery({
    queryKey: ["registration-requests", status ?? "all"],
    queryFn: () => getRegistrationRequests(status),
  });
};

export const useGetRegistrationRequest = (id: string) => {
  return useQuery({
    queryKey: ["registration-request", id],
    queryFn: () => getRegistrationRequest(id),
    enabled: !!id,
  });
};

export const useGetPendingRegistrationCount = () => {
  return useQuery({
    queryKey: ["registration-requests-pending-count"],
    queryFn: getPendingRegistrationCount,
  });
};

export const useApproveRegistration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveRegistrationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["registration-requests-pending-count"],
      });
      queryClient.invalidateQueries({ queryKey: ["user-area"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    },
  });
};

export const useRejectRegistration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      rejectionReason,
      reviewedBy,
      adminNotes,
    }: {
      requestId: string;
      rejectionReason: string;
      reviewedBy: string;
      adminNotes?: string;
    }) =>
      rejectRegistrationRequest(
        requestId,
        rejectionReason,
        reviewedBy,
        adminNotes
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["registration-requests-pending-count"],
      });
    },
  });
};

export const useGetFamilyMembers = (userId: string) => {
  return useQuery({
    queryKey: ["family-members", userId],
    queryFn: () => getFamilyMembersByUserId(userId),
    enabled: !!userId,
  });
};
