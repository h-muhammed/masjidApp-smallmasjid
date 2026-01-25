import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import AreaPaymentRow from "@/components/AreaPaymentRow";
import { PaymentType } from "@/types/types";
import { useGetAreaById, useGetPaymentsOfArea } from "@/api/areaApi";
import GoBackButton from "@/components/GoBackButton";
import FileSaver from "file-saver";
import { useFirebase } from "@/contexts/firebaseContext";

const Payments: NextPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const areaId = router.query.areaId;
  const { data: areaData } = useGetAreaById(areaId as string);

  const { user, loading } = useFirebase();

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const { data: paymentData, isPending: isPaymentPending } =
    useGetPaymentsOfArea(areaData?.areaCode);

  const filteredPayments = paymentData?.filter((payment: PaymentType) =>
    [
      payment.userId,
      payment.year,
      payment.month.toString(),
      payment.status,
    ].some((field) =>
      field.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleExport = () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      alert("No data to export!");
      return;
    }
    let csvContent = `Payment Details of Area ${areaId}\n`;
    csvContent = "User ID,Year,Month,Amount,Paid On,Status\n";

    csvContent += filteredPayments
      .map(
        (payment) =>
          `"${payment.userId || ""}","${payment.year || ""}","${
            payment.month.join("; ") || ""
          }","${payment.amount || ""}","${
            payment.paidAt.toDate().toLocaleString() || ""
          }","${payment.status || ""}"`
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    FileSaver.saveAs(blob, `Payment_Area_${areaId}.csv`);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (!router.isReady) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2">
        <GoBackButton />
        <h1 className="text-center text-2xl font-semibold">
          Payments of {areaId}
        </h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
        >
          Export to CSV
        </button>
      </div>
      <div
        className="flex items-center bg-gray-100 rounded-lg p-2 shadow-md"
        style={{ margin: "1rem" }}
      >
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search by User ID, Year, or Month"
          value={searchQuery}
          onChange={handleSearch}
          className="flex-grow bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>
      <div className="px-10 mt-10 overflow-x-auto">
        <table className="table table-zebra">
          <thead className="text-lg">
            <tr>
              <th>User ID</th>
              <th>Year</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Paid On</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="text-base">
            {isPaymentPending
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={6} className="text-center">
                      <div className="skeleton h-10 w-full rounded-none"></div>
                    </td>
                  </tr>
                ))
              : filteredPayments?.map((payment: PaymentType) => (
                  <AreaPaymentRow key={payment.id} payment={payment} />
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Payments;
