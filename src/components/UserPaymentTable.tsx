import { PaymentType } from "@/types/types";
import React from "react";
import UserPaymentRow from "./UserPaymentRow";

interface Props {
  payment: PaymentType[];
  isLoading: boolean;
}
const UserPaymentTable = ({ payment, isLoading }: Props) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="table w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="font-semibold text-gray-700 py-3">Year</th>
            <th className="font-semibold text-gray-700 py-3 min-w-[200px]">Months</th>
            <th className="font-semibold text-gray-700 py-3">Amount</th>
            <th className="font-semibold text-gray-700 py-3">Paid On</th>
            <th className="font-semibold text-gray-700 py-3">Status</th>
            <th className="font-semibold text-gray-700 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-gray-200">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                <td colSpan={6} className="text-center py-4">
                  <div className="skeleton h-10 w-full rounded-none"></div>
                </td>
              </tr>
            ))
          ) : payment.length > 0 ? (
            payment?.map((payment: PaymentType, index) => (
              <UserPaymentRow key={payment.id || index} payment={payment} />
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                No payment records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserPaymentTable;
