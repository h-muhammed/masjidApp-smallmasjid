import {
  useGetPaymentsOfUser,
  useGetUserById,
  useGetDonationsOfUser,
} from "@/api/areaApi";
import AddPayment from "@/components/AddPayment";
import AddDonation from "@/components/AddDonation";
import GoBackButton from "@/components/GoBackButton";
import UserPaymentTable from "@/components/UserPaymentTable";
import UserDonationTable from "@/components/UserDonationTable";
import { useFirebase } from "@/contexts/firebaseContext";
import { PaymentType, DonationType } from "@/types/types";
import FileSaver from "file-saver";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const User: NextPage = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const router = useRouter();
  const userId = router.query.userId;
  const { data: userData, isPending: isUserPending } = useGetUserById(
    userId as string
  );
  const { user, loading } = useFirebase();
  const { data: paymentData, isPending: isPaymentPending } =
    useGetPaymentsOfUser(userId as string);
  const { data: donationData, isPending: isDonationPending } =
    useGetDonationsOfUser(userId as string);

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  const handleOpenDonationModal = () => {
    setIsDonationModalOpen(true);
  };

  const handleCloseDonationModal = () => {
    setIsDonationModalOpen(false);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <span className="loading loading-bars loading-lg text-indigo-600"></span>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isUserPending && isPaymentPending && isDonationPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <span className="loading loading-bars loading-lg text-indigo-600"></span>
          <p className="mt-4 text-gray-600 font-medium">Loading user data...</p>
        </div>
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

    csvContent += "\nDonation History\n";
    csvContent += "Type,Given On,Amount,Quantity,Description,Given By\n";

    donationData?.forEach((donation: DonationType) => {
      csvContent += `"${donation.donationType}",`;
      csvContent += `"${
        donation.givenAt ? donation.givenAt.toDate().toLocaleString() : ""
      }",`;
      csvContent += `"${donation.amount || ""}",`;
      csvContent += `"${donation.quantity || ""}",`;
      csvContent += `"${donation.description || ""}",`;
      csvContent += `"${donation.givenBy || ""}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    FileSaver.saveAs(blob, `${userData?.name}_details.csv`);
  };

  const userDetails = [
    { label: "Name", value: userData?.name },
    { label: "Reference No", value: userData?.refNo },
    { label: "UID", value: userData?.uid },
    { label: "NIC", value: userData?.NIC },
    { label: "Area Code", value: userData?.areaId },
    { label: "Contact No", value: userData?.contactNo },
    { label: "Subscription", value: userData?.subscription },
    { label: "Address", value: userData?.address },
    { label: "Last Payment", value: userData?.lastPayment },
    {
      label: "Last Payment Date",
      value: userData?.lastPaymentDate
        ? new Date(userData.lastPaymentDate).toLocaleString()
        : "N/A",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
            {/* Left: Back Button */}
            <div className="flex items-center">
              <GoBackButton />
            </div>

            {/* Center: Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center flex-1">
              User Details
            </h1>

            {/* Right: Export Button */}
            <div className="flex justify-end">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="hidden sm:inline">Export to CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* User Information Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 sm:mb-8 border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Personal Information
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userDetails.map((detail, index) => (
                <div
                  key={index}
                  className="flex flex-col space-y-1 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {detail.label}
                  </span>
                  <span className="text-base font-semibold text-gray-900 break-words">
                    {detail.value || "N/A"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Payment History
            </h2>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-white hover:bg-green-50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 border border-green-200"
              onClick={handleOpenPaymentModal}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Payment
            </button>
          </div>

          <div className="p-6">
            <UserPaymentTable
              payment={paymentData as PaymentType[]}
              isLoading={isPaymentPending}
            />
          </div>
        </div>

        {/* Donation Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mt-6 sm:mt-8">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Donation History
            </h2>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 border border-purple-200"
              onClick={handleOpenDonationModal}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Donation
            </button>
          </div>

          <div className="p-6">
            <UserDonationTable
              donations={donationData as DonationType[]}
              isLoading={isDonationPending}
            />
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      <AddPayment
        areaCode={userData?.areaId}
        userId={userData?.uid}
        isModalOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
      />

      {/* Add Donation Modal */}
      <AddDonation
        areaId={userData?.areaId || ""}
        userId={userData?.uid || ""}
        isModalOpen={isDonationModalOpen}
        onClose={handleCloseDonationModal}
      />
    </div>
  );
};

export default User;