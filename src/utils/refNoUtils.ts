import { UserType } from "@/types/types";

export function calculateNextRefNo(users: UserType[]): string {
  if (!users.length) return "1";
  const refNos = users
    .map((user) => parseInt(user.refNo, 10))
    .filter((num) => !isNaN(num));
  const maxRefNo = Math.max(...refNos, 0);
  return String(maxRefNo + 1);
}

export function buildMemberUid(areaCode: string, refNo: string): string {
  return `${areaCode.replace(/\//g, "_")}_${refNo}`;
}
