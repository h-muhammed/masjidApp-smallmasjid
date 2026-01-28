import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  XCircleIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import AreaPaymentRow from "@/components/AreaPaymentRow";
import { PaymentType, UserType } from "@/types/types";
import {
  useGetAreaById,
  useGetPaymentsOfArea,
  useGetUsersByArea,
} from "@/api/areaApi";
import GoBackButton from "@/components/GoBackButton";
import FileSaver from "file-saver";
import { useFirebase } from "@/contexts/firebaseContext";
import AnalyticsCard from "@/components/AnalyticsCard";

type FilterType = "all" | "paid" | "unpaid";

const Payments: NextPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const router = useRouter();
  const areaId = router.query.areaId;
  const { data: areaData } = useGetAreaById(areaId as string);

  const { user, loading } = useFirebase();

  const { data: paymentData, isPending: isPaymentPending, error: paymentError } =
    useGetPaymentsOfArea(areaData?.areaCode || "");

  const { data: usersData, isPending: isUsersPending } = useGetUsersByArea(
    areaId as string
  );

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!paymentData || !usersData) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        paidUsersCount: 0,
        unpaidUsersCount: 0,
        paymentRate: 0,
        paidUserIds: new Set<string>(),
      };
    }

    const paidUserIds = new Set<string>(
      paymentData.map((p: PaymentType) => p.userId)
    );
    const totalAmount = paymentData.reduce(
      (sum: number, p: PaymentType) => sum + (p.amount || 0),
      0
    );
    const paidUsersCount = paidUserIds.size;
    const unpaidUsersCount = usersData.length - paidUsersCount;
    const paymentRate =
      usersData.length > 0
        ? Math.round((paidUsersCount / usersData.length) * 100)
        : 0;

    return {
      totalPayments: paymentData.length,
      totalAmount,
      paidUsersCount,
      unpaidUsersCount,
      paymentRate,
      paidUserIds,
    };
  }, [paymentData, usersData]);

  // Get unpaid users
  const unpaidUsers = useMemo(() => {
    if (!usersData || !statistics.paidUserIds) return [];
    return usersData.filter(
      (user: UserType) => !statistics.paidUserIds.has(user.uid)
    );
  }, [usersData, statistics.paidUserIds]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Filter payments based on search and filter type
  const filteredPayments = useMemo(() => {
    if (!paymentData) return [];

    const filtered = paymentData.filter((payment: PaymentType) =>
      [
        payment.userId,
        payment.year,
        payment.month.toString(),
        payment.status,
      ].some((field) =>
        field.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    // Apply filter type
    if (filterType === "paid") {
      // Already showing paid (all payments are paid)
      return filtered;
    } else if (filterType === "unpaid") {
      // For unpaid, we need to show users who haven't paid
      return [];
    }

    return filtered;
  }, [paymentData, searchQuery, filterType]);

  const handleExport = () => {
    const dataToExport =
      filterType === "unpaid" ? unpaidUsers : filteredPayments;

    if (!dataToExport || dataToExport.length === 0) {
      alert("No data to export!");
      return;
    }

    let csvContent = `Payment Details of Area ${areaId}\n`;

    if (filterType === "unpaid") {
      csvContent = "User ID,Ref No,Name,Contact No,Address\n";
      csvContent += (dataToExport as UserType[])
        .map(
          (user) =>
            `"${user.uid || ""}","${user.refNo || ""}","${user.name || ""}","${
              user.contactNo || ""
            }","${user.address || ""}"`
        )
        .join("\n");
    } else {
      csvContent = "User ID,Year,Month,Amount,Paid On,Status\n";
      csvContent += (dataToExport as PaymentType[])
        .map(
          (payment) =>
            `"${payment.userId || ""}","${payment.year || ""}","${
              payment.month.join("; ") || ""
            }","${payment.amount || ""}","${
              payment.paidAt.toDate().toLocaleString() || ""
            }","${payment.status || ""}"`
        )
        .join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    FileSaver.saveAs(
      blob,
      `${filterType === "unpaid" ? "Unpaid_Users" : "Payment"}_Area_${areaId}.csv`
    );
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Debug: Log data for troubleshooting
  useEffect(() => {
    if (areaData) {
      console.log("Area Data:", areaData);
      console.log("Area Code:", areaData.areaCode);
      console.log("Area ID:", areaId);
    }
    if (paymentData) {
      console.log("Payment Data Count:", paymentData.length);
      console.log("Sample Payment:", paymentData[0]);
    }
  }, [areaData, paymentData, areaId]);

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

  const isLoading = isPaymentPending || isUsersPending;
  const isAreaDataLoading = !areaData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <GoBackButton />
          <h1 className="text-center text-2xl font-bold text-gray-800">
            {areaData?.name || areaId} - Payment Overview
          </h1>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Error or Loading Message */}
      {isAreaDataLoading && (
        <div className="px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-yellow-700">
            Loading area information...
          </p>
        </div>
      )}
      {paymentError && (
        <div className="px-4 py-2 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">
            Error loading payments: {paymentError instanceof Error ? paymentError.message : "Unknown error"}
          </p>
        </div>
      )}
      {!isAreaDataLoading && !areaData?.areaCode && (
        <div className="px-4 py-2 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">
            Warning: Area code not found. Payments may not load correctly.
          </p>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <AnalyticsCard
            name="Total Payments"
            amount={statistics.totalPayments}
            icon={<ChartBarIcon className="h-8 w-8 text-white" />}
            bgColor="#4F46E5"
          />
          <AnalyticsCard
            name="Total Amount"
            amount={statistics.totalAmount}
            icon={<CurrencyDollarIcon className="h-8 w-8 text-white" />}
            isCurrency={true}
            bgColor="#10B981"
          />
          <AnalyticsCard
            name="Paid Users"
            amount={statistics.paidUsersCount}
            icon={<CheckCircleIcon className="h-8 w-8 text-white" />}
            bgColor="#059669"
          />
          <AnalyticsCard
            name="Unpaid Users"
            amount={statistics.unpaidUsersCount}
            icon={<XCircleIcon className="h-8 w-8 text-white" />}
            bgColor="#DC2626"
          />
          <AnalyticsCard
            name="Payment Rate"
            amount={statistics.paymentRate}
            icon={<UserGroupIcon className="h-8 w-8 text-white" />}
            isPercentage={true}
            bgColor="#7C3AED"
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Payments ({statistics.totalPayments})
              </button>
              <button
                onClick={() => setFilterType("paid")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === "paid"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Paid ({statistics.paidUsersCount})
              </button>
              <button
                onClick={() => setFilterType("unpaid")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === "unpaid"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Unpaid ({statistics.unpaidUsersCount})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center bg-gray-100 rounded-lg p-2 shadow-sm">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder={
                filterType === "unpaid"
                  ? "Search unpaid users by Name, Ref No, or Contact"
                  : "Search by User ID, Year, or Month"
              }
              value={searchQuery}
              onChange={handleSearch}
              className="flex-grow bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Unpaid Users Section */}
        {filterType === "unpaid" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <XCircleIcon className="h-6 w-6 text-red-600 mr-2" />
                Unpaid Users ({unpaidUsers.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="text-lg bg-gray-50">
                  <tr>
                    <th>Ref No</th>
                    <th>Name</th>
                    <th>Contact No</th>
                    <th>Address</th>
                    <th>Action</th>
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
                  ) : unpaidUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No unpaid users found
                      </td>
                    </tr>
                  ) : (
                    unpaidUsers
                      .filter((user: UserType) =>
                        [
                          user.name,
                          user.refNo,
                          user.contactNo,
                          user.address,
                        ].some((field) =>
                          field
                            .toString()
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                      )
                      .map((user: UserType) => (
                        <tr
                          key={user.uid}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/user/${user.uid}`)}
                        >
                          <td className="font-medium">{user.refNo}</td>
                          <td>{user.name}</td>
                          <td>{user.contactNo}</td>
                          <td className="max-w-xs truncate">{user.address}</td>
                          <td>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/user/${user.uid}`);
                              }}
                              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Table */}
        {filterType !== "unpaid" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <ChartBarIcon className="h-6 w-6 text-indigo-600 mr-2" />
                Payment Records ({filteredPayments.length})
              </h2>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="table w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="font-semibold text-gray-700 py-3">User ID</th>
                    <th className="font-semibold text-gray-700 py-3">Year</th>
                    <th className="font-semibold text-gray-700 py-3 min-w-[200px]">Months</th>
                    <th className="font-semibold text-gray-700 py-3">Amount</th>
                    <th className="font-semibold text-gray-700 py-3">Paid On</th>
                    <th className="font-semibold text-gray-700 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={6} className="text-center">
                          <div className="skeleton h-10 w-full rounded-none"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment: PaymentType) => (
                      <AreaPaymentRow key={payment.id} payment={payment} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Payments;
