import { Timestamp } from "firebase/firestore";

export interface AreaType {
  areaId: string;
  areaCode: string;
  name: string;
  shortName: string;
  totalUsers?: number;
  createAt: Timestamp;
}

export interface UserType {
  uid: string;
  refNo: string;
  name: string;
  NIC: string;
  address: string;
  areaCode: string;
  areaId: string;
  contactNo: string;
  lastPayment?: number;
  lastPaymentDate?: string;
  subscription: string;
}

export interface PaymentType {
  id?: string;
  userId: string;
  areaId: string;
  amount: number;
  month: string[];
  year: number;
  paidAt: Timestamp;
  status: string;
}

export interface DonationType {
  id?: string;
  userId: string;
  areaId: string; // For area-level reporting
  donationType: string; // e.g., "Zakat", "Dry Ration Pack", etc.
  amount?: number; // For monetary donations
  quantity?: number; // For item-based donations (e.g., packs)
  description?: string;
  givenAt: Timestamp;
  givenBy?: string; // Optional: who gave the donation
  referenceNumber?: string; // Optional: reference number for the donation
}

export type RegistrationStatus = "pending" | "approved" | "rejected";

export interface ChildFormType {
  name: string;
  dateOfBirth?: string;
  grade?: string;
  school?: string;
  gender?: string;
}

export interface SpouseFormType {
  name: string;
  NIC?: string;
  contactNo?: string;
  occupation?: string;
}

export interface RegistrationSubmitInput {
  name: string;
  NIC: string;
  address: string;
  contactNo: string;
  email?: string;
  notes?: string;
  spouse?: SpouseFormType | null;
  children: ChildFormType[];
}

export interface RegistrationRequestType extends RegistrationSubmitInput {
  id?: string;
  status: RegistrationStatus;
  submittedAt: Timestamp;
  assignedAreaId?: string;
  assignedAreaCode?: string;
  subscription?: string;
  refNo?: string;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
  approvedUserId?: string;
}

export type FamilyRelationship = "spouse" | "child";

export interface FamilyMemberType {
  id?: string;
  userId: string;
  registrationRequestId?: string;
  relationship: FamilyRelationship;
  name: string;
  NIC?: string;
  contactNo?: string;
  occupation?: string;
  dateOfBirth?: string;
  grade?: string;
  school?: string;
  gender?: string;
  createdAt: Timestamp;
}
