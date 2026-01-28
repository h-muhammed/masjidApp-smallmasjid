import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  GiftIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { DonationType } from "@/types/types";
import {
  useGetAreaById,
  useGetDonationsOfArea,
} from "@/api/areaApi";
import GoBackButton from "@/components/GoBackButton";
import FileSaver from "file-saver";
import { useFirebase } from "@/contexts/firebaseContext";
import AnalyticsCard from "@/components/AnalyticsCard";
import { DONATION_TYPES, getDonationTypeConfig } from "@/utils/donationTypes";

const Donations: NextPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const router = useRouter();
  const areaId = router.query.areaId;
  const { data: areaData } = useGetAreaById(areaId as string);

  const { user, loading } = useFirebase();

  const { data: donationData, isPending: isDonationPending, error: donationError } =
    useGetDonationsOfArea(areaId as string);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!donationData) {
      return {
        totalDonations: 0,
        totalAmount: 0,
        totalQuantity: 0,
        donationsByType: {} as Record<string, number>,
      };
    }

    const totalAmount = donationData.reduce(
      (sum: number, d: DonationType) => sum + (d.amount || 0),
      0
    );
    const totalQuantity = donationData.reduce(
      (sum: number, d: DonationType) => sum + (d.quantity || 0),
      0
    );

    const donationsByType: Record<string, number> = {};
    donationData.forEach((d: DonationType) => {
      donationsByType[d.donationType] = (donationsByType[d.donationType] || 0) + 1;
    });

    return {
      totalDonations: donationData.length,
      totalAmount,
      totalQuantity,
      donationsByType,
    };
  }, [donationData]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Filter donations based on search and filter type
  const filteredDonations = useMemo(() => {
    if (!donationData) return [];

    let filtered = donationData.filter((donation: DonationType) =>
      [
        donation.userId,
        donation.referenceNumber,
        donation.donationType,
        donation.description,
        donation.givenBy,
      ].some((field) =>
        field?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    // Apply filter type
    if (filterType !== "all") {
      filtered = filtered.filter((d: DonationType) => d.donationType === filterType);
    }

    return filtered;
  }, [donationData, searchQuery, filterType]);

  const handleExport = () => {
    if (!filteredDonations || filteredDonations.length === 0) {
      alert("No data to export!");
      return;
    }

    let csvContent = `Donation Details of Area ${areaId}\n`;
    csvContent = "User ID,Reference No,Type,Given On,Amount,Quantity,Description,Given By\n";

    csvContent += filteredDonations
      .map(
        (donation) =>
          `"${donation.userId || ""}","${donation.referenceNumber || ""}","${donation.donationType || ""}","${
            donation.givenAt.toDate().toLocaleString() || ""
          }","${donation.amount || ""}","${donation.quantity || ""}","${
            donation.description || ""
          }","${donation.givenBy || ""}"`
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    FileSaver.saveAs(blob, `Donations_Area_${areaId}.csv`);
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

  const isLoading = isDonationPending;
  const isAreaDataLoading = !areaData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <GoBackButton />
          <h1 className="text-center text-2xl font-bold text-gray-800">
            {areaData?.name || areaId} - Donation Overview
          </h1>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Error or Loading Message */}
      {isAreaDataLoading && (
        <div className="px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-yellow-700">Loading area information...</p>
        </div>
      )}
      {donationError && (
        <div className="px-4 py-2 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">
            Error loading donations:{" "}
            {donationError instanceof Error
              ? donationError.message
              : "Unknown error"}
          </p>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AnalyticsCard
            name="Total Donations"
            amount={statistics.totalDonations}
            icon={<ChartBarIcon className="h-8 w-8 text-white" />}
            bgColor="#7C3AED"
          />
          <AnalyticsCard
            name="Total Amount"
            amount={statistics.totalAmount}
            icon={<CurrencyDollarIcon className="h-8 w-8 text-white" />}
            isCurrency={true}
            bgColor="#10B981"
          />
          <AnalyticsCard
            name="Total Quantity"
            amount={statistics.totalQuantity}
            icon={<GiftIcon className="h-8 w-8 text-white" />}
            bgColor="#4F46E5"
          />
          <AnalyticsCard
            name="Donation Types"
            amount={Object.keys(statistics.donationsByType).length}
            icon={<GiftIcon className="h-8 w-8 text-white" />}
            bgColor="#EC4899"
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({statistics.totalDonations})
              </button>
              {DONATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterType === type.value
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.label} ({statistics.donationsByType[type.value] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center bg-gray-100 rounded-lg p-2 shadow-sm">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search by User ID, Reference No, Type, Description, or Given By"
              value={searchQuery}
              onChange={handleSearch}
              className="flex-grow bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <ChartBarIcon className="h-6 w-6 text-purple-600 mr-2" />
              Donation Records ({filteredDonations.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="font-semibold text-gray-700 py-3">User ID</th>
                  <th className="font-semibold text-gray-700 py-3">Reference No</th>
                  <th className="font-semibold text-gray-700 py-3">Type</th>
                  <th className="font-semibold text-gray-700 py-3">Given On</th>
                  <th className="font-semibold text-gray-700 py-3">Amount</th>
                  <th className="font-semibold text-gray-700 py-3">Quantity</th>
                  <th className="font-semibold text-gray-700 py-3">Description</th>
                  <th className="font-semibold text-gray-700 py-3">Given By</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={8} className="text-center py-4">
                        <div className="skeleton h-10 w-full rounded-none"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredDonations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No donations found
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((donation: DonationType) => {
                    const typeConfig = getDonationTypeConfig(donation.donationType);
                    return (
                      <tr
                        key={donation.id}
                        className="hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer"
                        onClick={() => router.push(`/user/${donation.userId}`)}
                      >
                        <td className="py-3 hover:font-semibold hover:text-purple-600 transition-all">
                          {donation.userId}
                        </td>
                        <td className="py-3 text-sm text-gray-700">
                          {donation.referenceNumber || "-"}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-md">
                            {typeConfig?.label || donation.donationType}
                          </span>
                        </td>
                        <td className="text-sm text-gray-600 py-3 whitespace-nowrap">
                          {donation.givenAt.toDate().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3">
                          {donation.amount ? (
                            <span className="font-semibold text-green-600">
                              Rs. {donation.amount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          {donation.quantity ? (
                            <span className="font-semibold text-blue-600">
                              {donation.quantity}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="text-sm text-gray-600 py-3 max-w-xs truncate">
                          {donation.description || "-"}
                        </td>
                        <td className="text-sm text-gray-600 py-3">
                          {donation.givenBy || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donations;
