import { DonationType } from "@/types/types";
import React from "react";
import UserDonationRow from "./UserDonationRow";

interface Props {
  donations: DonationType[];
  isLoading: boolean;
}

const UserDonationTable = ({ donations, isLoading }: Props) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="table w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="font-semibold text-gray-700 py-3">Reference No</th>
            <th className="font-semibold text-gray-700 py-3">Type</th>
            <th className="font-semibold text-gray-700 py-3">Given On</th>
            <th className="font-semibold text-gray-700 py-3">Amount/Quantity</th>
            <th className="font-semibold text-gray-700 py-3">Description</th>
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
          ) : donations.length > 0 ? (
            donations?.map((donation: DonationType, index) => (
              <UserDonationRow key={donation.id || index} donation={donation} />
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                No donation records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserDonationTable;
