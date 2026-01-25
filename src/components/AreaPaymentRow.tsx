import { PaymentType } from "@/types/types";
import { useRouter } from "next/router";
import React from "react";

interface Props {
  payment: PaymentType;
}

const AreaPaymentRow = ({ payment }: Props) => {
  const router = useRouter();
  return (
    <tr>
      <td
        onClick={() => router.push(`/user/${payment?.userId}`)}
        className="cursor-pointer hover:font-bold hover:underline hover:underline-offset-2"
      >
        {payment?.userId}
      </td>
      <td>{payment?.year}</td>
      <td>
        {payment?.month?.map((month: string, index: number) => (
          <div key={index}>{month}</div>
        ))}
      </td>
      <td>{payment?.amount}</td>
      <td>{payment.paidAt.toDate().toLocaleString()}</td>
      <td>{payment?.status}</td>
    </tr>
  );
};

export default AreaPaymentRow;
