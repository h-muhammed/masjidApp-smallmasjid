import { useGetPaymentsOfUser, useGetUserById } from "@/api/areaApi";
import AddPayment from "@/components/AddPayment";
import GoBackButton from "@/components/GoBackButton";
import UserPaymentTable from "@/components/UserPaymentTable";
import { useFirebase } from "@/contexts/firebaseContext";
import { PaymentType } from "@/types/types";
import FileSaver from "file-saver";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const User: NextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const userId = router.query.userId;
  const { data: userData, isPending: isUserPending } = useGetUserById(
    userId as string
  );
  const { user, loading } = useFirebase();
  const { data: paymentData, isPending: isPaymentPending } =
    useGetPaymentsOfUser(userId as string);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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

  if (isUserPending && isPaymentPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    );
  }

  const handleExport = () => {
    let csvContent = "User Details\n";

    csvContent +=
      "Name,Reference No,UID,NIC,Area Code,Contact No,Subscription,Address,Last Payment,Last Payment Date\n";

    csvContent += `"${userData?.name || ""}",`;
    csvContent += `"${userData?.refNo || ""}",`;
    csvContent += `"${userData?.uid || ""}",`;
    csvContent += `"${userData?.NIC || ""}",`;
    csvContent += `"${userData?.areaId || ""}",`;
    csvContent += `"${userData?.contactNo || ""}",`;
    csvContent += `"${userData?.subscription || ""}",`;
    csvContent += `"${userData?.address || ""}",`;
    csvContent += `"${userData?.lastPayment || ""}",`;
    csvContent += `"${
      userData?.lastPaymentDate
        ? new Date(userData.lastPaymentDate).toLocaleString()
        : ""
    }"\n\n`;

    csvContent += "Payment History\n";
    csvContent += "Year,Months,Amount,Status,Payment Date\n";

    paymentData?.forEach((payment) => {
      csvContent += `"${payment.year}",`;
      csvContent += `"${payment.month.join("; ")}",`;
      csvContent += `"${payment.amount}",`;
      csvContent += `"${payment.status}",`;
      csvContent += `"${
        payment.paidAt ? payment.paidAt.toDate().toLocaleString() : ""
      }"\n`;
    });

    // Create and save the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    FileSaver.saveAs(blob, `${userData?.name}_details.csv`);
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2">
        <GoBackButton />
        <h1 className="text-center text-2xl font-semibold">User Details</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-md font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
        >
          Export to CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10">
        {/* Left Column */}
        <div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">Name:</p>
            <p className="text-xl text-[#979dab]">{userData?.name}</p>
          </div>
          <div className="divider"></div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">
              Reference No:
            </p>
            <p className="text-xl text-[#979dab]">{userData?.refNo}</p>
          </div>
          <div className="divider"></div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">UID:</p>
            <p className="text-xl text-[#979dab]">{userData?.uid}</p>
          </div>
          <div className="divider"></div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">NIC:</p>
            <p className="text-xl text-[#979dab]">{userData?.NIC}</p>
          </div>
          <div className="divider"></div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">Area Code:</p>
            <p className="text-xl text-[#979dab]">{userData?.areaId}</p>
          </div>
          <div className="divider"></div>
        </div>
        {/* Right Column */}
        <div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">Contact No:</p>
            <p className="text-xl text-[#979dab]">{userData?.contactNo}</p>
          </div>
          <div className="divider"></div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">
              Subscription:
            </p>
            <p className="text-xl text-[#979dab]">{userData?.subscription}</p>
          </div>
          <div className="divider"></div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">Address:</p>
            <p className="text-xl text-[#979dab]">{userData?.address}</p>
          </div>
          <div className="divider"></div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">
              Last Payment:
            </p>
            <p className="text-xl text-[#979dab]">{userData?.lastPayment}</p>
          </div>
          <div className="divider"></div>
          <div className="flex gap-5 justify-between">
            <p className="text-xl font-semibold text-[#596170]">
              Last Payment Date:
            </p>
            <p className="text-xl text-[#979dab]">
              {new Date(userData?.lastPaymentDate).toLocaleString()}
            </p>
          </div>
          <div className="divider"></div>
        </div>
      </div>
      <div className="flex justify-end px-5">
        <button
          className="px-4 py-2 text-md font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
          onClick={handleOpenModal}
        >
          + Add Payment
        </button>
      </div>
      <UserPaymentTable
        payment={paymentData as PaymentType[]}
        isLoading={isPaymentPending}
      />
      <AddPayment
        areaCode={userData?.areaId}
        userId={userData?.uid}
        isModalOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default User;
