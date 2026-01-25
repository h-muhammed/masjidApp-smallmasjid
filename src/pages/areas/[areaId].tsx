import { useGetAreaById, useGetUsersByArea } from "@/api/areaApi";
import AddUser from "@/components/AddUser";
import BulkPayment from "@/components/BulkPayment";
import GoBackButton from "@/components/GoBackButton";
import TableRow from "@/components/TableRow";
import { UserType } from "@/types/types";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import FileSaver from "file-saver";
import { useFirebase } from "@/contexts/firebaseContext";

const Area: NextPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkPaymentModalOpen, setIsBulkPaymentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const router = useRouter();
  const areaId = router.query.areaId;
  const { data: areaData } = useGetAreaById(areaId as string);
  const { data: usersData, isLoading } = useGetUsersByArea(areaData?.areaCode);
  const { user, loading } = useFirebase();

  

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenBulkPaymentModal = () => {
    setIsBulkPaymentModalOpen(true);
  };

  const handleCloseBulkPaymentModal = () => {
    setIsBulkPaymentModalOpen(false);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredUsers = usersData?.filter((user: UserType) =>
    [
      user.name,
      user.refNo,
      user.address,
      user.NIC,
      user.contactNo,
      user.subscription,
      user.uid,
    ].some((field) =>
      field.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalUsers = filteredUsers?.length || 0;

  const handleExport = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      alert("No data to export!");
      return;
    }

    let csvContent = "Ref No,Name,NIC,Contact No,Subscription,Address\n";

    csvContent += filteredUsers
      .map(
        (user) =>
          `"${user.refNo || ""}","${user.name || ""}","${user.NIC || ""}","${
            user.contactNo || ""
          }","${user.subscription || ""}","${user.address || ""}"`
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    FileSaver.saveAs(blob, `Area_${areaData?.areaCode}_Users.csv`);
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
      <div className="flex items-center justify-between px-4 py-2 flex-wrap">
        <div className="w-24">
          <GoBackButton />
        </div>
        <h1 className="text-2xl font-semibold text-center flex-1">
          Area {areaData?.name} - {areaData?.areaCode}
        </h1>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 shadow-md rounded-lg border border-gray-200 m-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Members: <span className="text-indigo-600">{totalUsers}</span>
        </h2>
        <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all flex-1 md:flex-none"
            onClick={handleOpenBulkPaymentModal}
          >
            💳 Bulk Payment
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all flex-1 md:flex-none"
            onClick={() => router.push(`/payments/${areaId}`)}
          >
            Payment History
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex-1 md:flex-none"
            onClick={handleExport}
          >
            Export to CSV
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all flex-1 md:flex-none"
            onClick={handleOpenModal}
          >
            + Add New User
          </button>
        </div>
      </div>
      <div
        className="flex items-center bg-gray-100 rounded-lg p-2 shadow-md"
        style={{ margin: "1rem" }}
      >
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search by Name, Ref No, or Address"
          value={searchQuery}
          onChange={handleSearch}
          className="flex-grow bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>
      <div className="px-10 mt-10 overflow-x-auto">
        <table className="table table-zebra">
          <thead className="text-lg">
            <tr>
              <th>Ref No</th>
              <th>Name</th>
              <th>NIC</th>
              <th>Contact No</th>
              <th>Subscription</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody className="text-base">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={6} className="text-center">
                      <div className="skeleton h-10 w-full rounded-none"></div>
                    </td>
                  </tr>
                ))
              : filteredUsers?.map((user: UserType) => (
                  <TableRow key={user.uid} user={user} />
                ))}
          </tbody>
        </table>
      </div>
      <AddUser
        areaCode={areaData?.areaCode}
        isModalOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      <BulkPayment
        areaCode={areaData?.areaCode || ""}
        isModalOpen={isBulkPaymentModalOpen}
        onClose={handleCloseBulkPaymentModal}
      />
    </div>
  );
};

export default Area;
