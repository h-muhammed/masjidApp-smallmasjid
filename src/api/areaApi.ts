import { firestore } from "@/config/firebase";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AreaType, PaymentType, UserType, DonationType } from "@/types/types";

const getAreas = async () => {
  const areasCollection = collection(firestore, "areas");
  const snapshot = await getDocs(areasCollection);
  return snapshot.docs.map((doc) => ({ ...doc.data() } as AreaType));
};

export const useGetAreas = () => {
  return useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });
};

const getAreaById = async (areaId: string) => {
  const areasCollectionRef = collection(firestore, "areas");
  const areaQuery = query(areasCollectionRef, where("areaId", "==", areaId)); // Query for the `areaId`
  const snapshot = await getDocs(areaQuery);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { ...doc.data() };
  }

  throw new Error(`Area with areaId ${areaId} not found`);
};

export const useGetAreaById = (areaId: string) => {
  return useQuery({
    queryKey: ["area", areaId],
    queryFn: () => getAreaById(areaId),
    enabled: !!areaId,
  });
};

const getUserById = async (userId: string) => {
  const userCollectionRef = collection(firestore, "users");
  const userQuery = query(userCollectionRef, where("uid", "==", userId));
  const snapshot = await getDocs(userQuery);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { ...doc.data() };
  }

  throw new Error(`User with userId ${userId} not found`);
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};

// Search user by ID (uid) or Reference Number (refNo)
const searchUserByIdOrRefNo = async (searchTerm: string) => {
  const userCollectionRef = collection(firestore, "users");
  
  // Try to find by uid first
  const uidQuery = query(userCollectionRef, where("uid", "==", searchTerm));
  const uidSnapshot = await getDocs(uidQuery);
  
  if (!uidSnapshot.empty) {
    const doc = uidSnapshot.docs[0];
    return { ...doc.data() } as UserType;
  }
  
  // If not found by uid, try refNo
  const refNoQuery = query(userCollectionRef, where("refNo", "==", searchTerm));
  const refNoSnapshot = await getDocs(refNoQuery);
  
  if (!refNoSnapshot.empty) {
    const doc = refNoSnapshot.docs[0];
    return { ...doc.data() } as UserType;
  }

  throw new Error(`User with ID or Ref No "${searchTerm}" not found`);
};

export const useSearchUserByIdOrRefNo = (searchTerm: string) => {
  return useQuery({
    queryKey: ["user-search", searchTerm],
    queryFn: () => searchUserByIdOrRefNo(searchTerm),
    enabled: !!searchTerm && searchTerm.length > 0,
    retry: false,
  });
};

const getUsersByArea = async (areaId: string) => {
  const usersCollection = collection(firestore, "users");
  const userQuery = query(usersCollection, where("areaId", "==", areaId)); // Query for the `areaId`
  const snapshot = await getDocs(userQuery);
  return snapshot.docs
    .map((doc) => ({ ...doc.data() } as UserType))
    .sort((a, b) =>
      a.refNo.localeCompare(b.refNo, undefined, { numeric: true })
    );
};

export const useGetUsersByArea = (areaId: string) => {
  return useQuery({
    queryKey: ["user-area", areaId],
    queryFn: () => getUsersByArea(areaId),
    enabled: !!areaId,
  });
};

export const createUser = async (user: UserType) => {
  const docId = `${user.uid}`; // Generate document ID
  const userDoc = doc(firestore, "users", docId); // Reference to the document
  await setDoc(userDoc, user); // Set the document data
  return user;
};

export const useCreateUser = (onSuccess: () => void, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: UserType) => createUser(user),
    onError,
    onSuccess: (user: UserType) => {
      queryClient.invalidateQueries({ queryKey: ["user-area", user.areaCode] });
      onSuccess();
    },
  });
};

const getPaymentsOfUser = async (userId: string) => {
  const paymentsCollection = collection(firestore, "payments");
  const paymentQuery = query(paymentsCollection, where("userId", "==", userId));
  const snapshot = await getDocs(paymentQuery);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as PaymentType)
  );
};

export const useGetPaymentsOfUser = (userId: string) => {
  return useQuery({
    queryKey: ["user-payment", userId],
    queryFn: () => getPaymentsOfUser(userId),
    enabled: !!userId,
  });
};

export const editUser = async (
  userId: string,
  updatedData: Partial<UserType>
) => {
  try {
    // First, try to update using userId as document ID (for documents created with uid as ID)
    const userDoc = doc(firestore, "users", userId);
    await updateDoc(userDoc, updatedData);
  } catch (error: unknown) {
    // Check if it's a "document not found" error
    const firestoreError = error as { code?: string | number; message?: string };
    const isNotFoundError = 
      firestoreError?.code === "not-found" || 
      firestoreError?.code === 5 || // Firestore error code 5 is NOT_FOUND
      firestoreError?.message?.includes("No document to update") ||
      firestoreError?.message?.includes("not found");

    if (isNotFoundError) {
      // If document doesn't exist with that ID, query by uid field
      const userCollectionRef = collection(firestore, "users");
      const userQuery = query(userCollectionRef, where("uid", "==", userId));
      const snapshot = await getDocs(userQuery);

      if (snapshot.empty) {
        throw new Error(`User with uid ${userId} not found`);
      }

      // Get the actual document ID and update
      const userDocRef = snapshot.docs[0].ref;
      await updateDoc(userDocRef, updatedData);
    } else {
      // Re-throw other errors
      console.error("Error updating user:", firestoreError);
      throw error;
    }
  }
};

export const useEditUser = (onSuccess: () => void, onError?: (error: Error) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; updatedData: Partial<UserType>; currentAreaCode?: string }) =>
      editUser(data.userId, data.updatedData),
    onError: (error: Error) => {
      if (onError) {
        onError(error);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate user list queries for the current area (using areaCode which matches the query key)
      if (variables.currentAreaCode) {
        queryClient.invalidateQueries({ queryKey: ["user-area", variables.currentAreaCode] });
      }
      // Invalidate all user-area queries to ensure the list updates
      queryClient.invalidateQueries({ queryKey: ["user-area"] });
      // Invalidate individual user query to refresh user details page
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
      onSuccess();
    },
  });
};

export const deleteUser = async (userId: string) => {
  // IMPORTANT: deleteDoc() does NOT throw if the document doesn't exist.
  // So we must check existence first; otherwise UI may show "deleted" when nothing happened.
  const directRef = doc(firestore, "users", userId);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) {
    await deleteDoc(directRef);
    return;
  }

  // If document ID != uid, find by uid field and delete the real doc
  const userCollectionRef = collection(firestore, "users");
  const userQuery = query(userCollectionRef, where("uid", "==", userId));
  const snapshot = await getDocs(userQuery);

  if (snapshot.empty) {
    throw new Error(`User with uid ${userId} not found`);
  }

  await deleteDoc(snapshot.docs[0].ref);
};

export const useDeleteUser = (
  onSuccess: () => void,
  onError?: (error: Error) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; currentAreaCode?: string }) =>
      deleteUser(data.userId),
    onError: (error: Error) => {
      if (onError) onError(error);
    },
    onSuccess: (_, variables) => {
      if (variables.currentAreaCode) {
        queryClient.invalidateQueries({
          queryKey: ["user-area", variables.currentAreaCode],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["user-area"] });
      onSuccess();
    },
  });
};



// Fetch today's collection


export const fetchTodayCollection = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const q = query(
    collection(firestore, "payments"),
    where("paidAt", ">=", Timestamp.fromDate(startOfDay)),
    where("paidAt", "<=", Timestamp.fromDate(endOfDay))
  );

  const snapshot = await getDocs(q);

  let total = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const amount = data.amount || 0; // Ensure amount is defined
    const monthsPaid = data.month || []; // Handle cases where month is undefined

    if (Array.isArray(monthsPaid) && monthsPaid.length > 0) {
      total += amount * monthsPaid.length; // Multiply amount by the number of months paid
    }
  });

  return Math.round(total); // Round the total to an integer, similar to the Flutter code
};


// Fetch monthly collection
export const fetchMonthCollection = async () => {
  const now = new Date();
  const currentMonth = now.toLocaleString("default", { month: "short" }).toUpperCase();
  const currentYear = now.getFullYear();

  const q = query(
    collection(firestore, "payments"),
    where("month", "array-contains", currentMonth),
    where("year", "==", currentYear)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.reduce((total, doc) => total + doc.data().amount, 0);
};

// Real-time updates for today's collection
export const subscribeToTodayCollection = (callback: (total: number) => void) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const q = query(
    collection(firestore, "payments"),
    where("paidAt", ">=", Timestamp.fromDate(startOfDay)),
    where("paidAt", "<=", Timestamp.fromDate(endOfDay))
  );

  return onSnapshot(q, (snapshot) => {
    const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
    callback(total);
  });
};

// Fetch monthly collection with history
// Fetch monthly collection with history
export const fetchMonthlyCollectionHistoryOptimized = async (year: number) => {
  const paymentsCollection = collection(firestore, "payments");

  const allDocs = await getDocs(paymentsCollection);
  const monthlyTotals = Array(12).fill(0); // Array to store total for each month

  allDocs.forEach((doc) => {
    const paymentData = doc.data();
    const paymentMonth = paymentData?.paymentMonth; // Month stored as an integer (0 = January, 1 = February, ...)
    const paymentYear = paymentData?.paymentYear;
    const amount = paymentData?.amount || 0;

    if (paymentYear === year && paymentMonth >= 0 && paymentMonth < 12) {
      // Add the payment amount to the corresponding month in the total array
      monthlyTotals[paymentMonth] += amount;
    }
  });

  return monthlyTotals.map((total, month) => ({
    month: new Date(year, month, 1).toLocaleString("default", { month: "short" }),
    year,
    total,
  }));
};

export const addPayment = async (payment: PaymentType) => {
  const paymentCollection = collection(firestore, "payments");
  await addDoc(paymentCollection, payment);
  return payment;
};

export const addBatchPayments = async (payments: PaymentType[]) => {
  const paymentCollection = collection(firestore, "payments");
  const promises = payments.map((payment) => addDoc(paymentCollection, payment));
  await Promise.all(promises);
  return payments;
};

export const useAddPayment = (onSuccess: () => void, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payment: PaymentType) => addPayment(payment),
    onError,
    onSuccess: (payment: PaymentType) => {
      queryClient.invalidateQueries({
        queryKey: ["user-payment", payment.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["area-payment", payment.areaId],
      });
      onSuccess();
    },
  });
};

export const useAddBatchPayments = (onSuccess: () => void, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payments: PaymentType[]) => addBatchPayments(payments),
    onError,
    onSuccess: (payments: PaymentType[]) => {
      // Invalidate queries for all affected users and areas
      const userIds = [...new Set(payments.map((p) => p.userId))];
      const areaIds = [...new Set(payments.map((p) => p.areaId))];
      
      userIds.forEach((userId) => {
        queryClient.invalidateQueries({
          queryKey: ["user-payment", userId],
        });
      });
      
      areaIds.forEach((areaId) => {
        queryClient.invalidateQueries({
          queryKey: ["area-payment", areaId],
        });
      });
      
      onSuccess();
    },
  });
};

export const editPayment = async (
  paymentId: string,
  updatedData: Partial<PaymentType>
) => {
  const paymentDoc = doc(firestore, "payments", paymentId);
  await updateDoc(paymentDoc, updatedData);
  return updatedData;
};

export const useEditPayment = (onSuccess: () => void, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      paymentId: string;
      updatedData: Partial<PaymentType>;
    }) => editPayment(data.paymentId, data.updatedData),
    onError,
    onSuccess: (payment: Partial<PaymentType>) => {
      queryClient.invalidateQueries({
        queryKey: ["user-payment", payment.userId],
      });
      onSuccess();
    },
  });
};

export const deletePayment = async (paymentId: string, userId: string) => {
  const paymentDoc = doc(firestore, "payments", paymentId);
  await deleteDoc(paymentDoc);
  return { paymentId, userId };
};

export const useDeletePayment = (
  onSuccess: () => void,
  onError: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      userId,
    }: {
      paymentId: string;
      userId: string;
    }) => deletePayment(paymentId, userId),
    onError,
    onSuccess: ({ userId }: { userId: string }) => {
      queryClient.invalidateQueries({
        queryKey: ["user-payment", userId],
      });
      onSuccess();
    },
  });
};

const getPaymentsOfArea = async (areaId: string) => {
  const paymentsCollection = collection(firestore, "payments");
  const paymentQuery = query(paymentsCollection, where("areaId", "==", areaId));
  const snapshot = await getDocs(paymentQuery);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as PaymentType)
  );
};

export const useGetPaymentsOfArea = (areaId: string) => {
  return useQuery({
    queryKey: ["area-payment", areaId],
    queryFn: () => getPaymentsOfArea(areaId),
    enabled: !!areaId,
  });
};

// Donation API Functions

const getDonationsOfUser = async (userId: string) => {
  const donationsCollection = collection(firestore, "donations");
  const donationQuery = query(donationsCollection, where("userId", "==", userId));
  const snapshot = await getDocs(donationQuery);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as DonationType)
  );
};

export const useGetDonationsOfUser = (userId: string) => {
  return useQuery({
    queryKey: ["user-donation", userId],
    queryFn: () => getDonationsOfUser(userId),
    enabled: !!userId,
  });
};

const getDonationsOfArea = async (areaId: string) => {
  const donationsCollection = collection(firestore, "donations");
  const donationQuery = query(donationsCollection, where("areaId", "==", areaId));
  const snapshot = await getDocs(donationQuery);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as DonationType)
  );
};

export const useGetDonationsOfArea = (areaId: string) => {
  return useQuery({
    queryKey: ["area-donation", areaId],
    queryFn: () => getDonationsOfArea(areaId),
    enabled: !!areaId,
  });
};

export const addDonation = async (donation: DonationType) => {
  const donationCollection = collection(firestore, "donations");
  await addDoc(donationCollection, donation);
  return donation;
};

export const useAddDonation = (onSuccess: () => void, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (donation: DonationType) => addDonation(donation),
    onError,
    onSuccess: (donation: DonationType) => {
      queryClient.invalidateQueries({
        queryKey: ["user-donation", donation.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["area-donation", donation.areaId],
      });
      onSuccess();
    },
  });
};

export const editDonation = async (
  donationId: string,
  updatedData: Partial<DonationType>
) => {
  const donationDoc = doc(firestore, "donations", donationId);
  await updateDoc(donationDoc, updatedData);
  return updatedData;
};

export const useEditDonation = (onSuccess: () => void, onError: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      donationId: string;
      updatedData: Partial<DonationType>;
    }) => editDonation(data.donationId, data.updatedData),
    onError,
    onSuccess: (donation: Partial<DonationType>) => {
      queryClient.invalidateQueries({
        queryKey: ["user-donation", donation.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["area-donation", donation.areaId],
      });
      onSuccess();
    },
  });
};

export const deleteDonation = async (donationId: string, userId: string) => {
  const donationDoc = doc(firestore, "donations", donationId);
  await deleteDoc(donationDoc);
  return { donationId, userId };
};

export const useDeleteDonation = (
  onSuccess: () => void,
  onError: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      donationId,
      userId,
    }: {
      donationId: string;
      userId: string;
    }) => deleteDonation(donationId, userId),
    onError,
    onSuccess: ({ userId }: { userId: string }) => {
      queryClient.invalidateQueries({
        queryKey: ["user-donation", userId],
      });
      onSuccess();
    },
  });
};
