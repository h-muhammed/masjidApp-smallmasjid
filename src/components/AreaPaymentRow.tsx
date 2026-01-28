import { PaymentType } from "@/types/types";
import { useRouter } from "next/router";
import React from "react";

interface Props {
  payment: PaymentType;
}

const AreaPaymentRow = ({ payment }: Props) => {
  const router = useRouter();
  
  // Format months as compact badges
  const monthBadges = payment?.month?.map((month: string, index: number) => (
    <span
      key={index}
      className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-md hover:bg-indigo-200 transition-colors"
    >
      {month}
    </span>
  ));

  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
      <td
        onClick={() => router.push(`/user/${payment?.userId}`)}
        className="cursor-pointer hover:font-semibold hover:text-indigo-600 transition-all py-3"
      >
        {payment?.userId}
      </td>
      <td className="font-medium py-3">{payment?.year}</td>
      <td className="py-3">
        <div className="flex flex-wrap gap-1.5 max-w-xs">
          {monthBadges?.length ? (
            monthBadges
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      </td>
      <td className="font-semibold text-green-600 py-3">
        Rs. {payment?.amount?.toLocaleString() || "0"}
      </td>
      <td className="text-sm text-gray-600 py-3 whitespace-nowrap">
        {payment.paidAt.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="py-3">
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
            payment?.status?.toLowerCase() === "paid"
              ? "bg-green-100 text-green-800"
              : payment?.status?.toLowerCase() === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {payment?.status || "N/A"}
        </span>
      </td>
    </tr>
  );
};

export default AreaPaymentRow;
