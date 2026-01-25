import { PaymentType } from "@/types/types";
import React from "react";
import UserPaymentRow from "./UserPaymentRow";

interface Props {
  payment: PaymentType[];
  isLoading: boolean;
}
const UserPaymentTable = ({ payment, isLoading }: Props) => {
  return (
    <div className="my-10">
      <h1 className="text-center text-2xl font-semibold">
        User Payment History
      </h1>
      <div className="px-10 mt-10 overflow-x-auto">
        <table className="table table-zebra">
          <thead className="text-lg">
            <tr>
              <th>Year</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Paid On</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="text-base">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={5} className="text-center">
                    <div className="skeleton h-10 w-full rounded-none"></div>
                  </td>
                </tr>
              ))
            ) : payment.length > 0 ? (
              payment?.map((payment: PaymentType, index) => (
                <UserPaymentRow key={index} payment={payment} />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">
                  No Data Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserPaymentTable;
