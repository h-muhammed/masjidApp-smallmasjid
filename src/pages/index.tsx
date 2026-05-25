import {
  fetchMonthCollection,
  fetchTodayCollection,
  useGetAreas,
} from "@/api/areaApi";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import AnalyticsCard from "@/components/AnalyticsCard";
import AreaCard from "@/components/AreaCard";
import CentralizedPayment from "@/components/CentralizedPayment";
import ImportAreas from "@/components/ImportAreas";
import LoadingScreen from "@/components/LoadingScreen";
import { AreaType } from "@/types/types";
import { NextPage } from "next";
import { useFirebase } from "@/contexts/firebaseContext";
import { useRouter } from "next/router";
import {
  FaUsers,
  FaMapMarkedAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaArrowRight,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import { masjidConfig } from "@/config/masjid";
import { useGetPendingRegistrationCount } from "@/api/registrationApi";
import Link from "next/link";
import { FaClipboardList } from "react-icons/fa";

const fetchUsers = async () => {
  const usersCollection = collection(firestore, "users");
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.length;
};

const getCurrentDay = () => {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date()
  );
};

const getCurrentMonth = () => {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date());
};

const formatTodayDate = () => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
};

const Home: NextPage = () => {
  const { data: areaData = [], isLoading: areasLoading } = useGetAreas();
  const { data: userCount, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const { user, loading } = useFirebase();
  const router = useRouter();
  const { data: pendingRegistrations = 0 } = useGetPendingRegistrationCount();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isImportAreasOpen, setIsImportAreasOpen] = useState(false);
  const [todayCollection, setTodayCollection] = useState(0);
  const [monthCollection, setMonthCollection] = useState(0);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCollectionsLoading(true);
        await Promise.all([
          fetchTodayCollection().then(setTodayCollection),
          fetchMonthCollection().then(setMonthCollection),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setCollectionsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || usersLoading || areasLoading || collectionsLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const currentDay = getCurrentDay();
  const currentMonth = getCurrentMonth();

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">{formatTodayDate()}</p>
        </div>

        {/* Registrations inbox */}
        <section className="mb-8">
          <Link
            href="/registrations"
            className="block bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 transition-all"
          >
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                  style={{
                    backgroundColor: `${masjidConfig.primaryColor}18`,
                    color: masjidConfig.primaryColor,
                  }}
                >
                  <FaClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Member registrations
                  </h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Review public form submissions and approve into areas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {pendingRegistrations > 0 ? (
                  <span className="badge badge-warning font-semibold">
                    {pendingRegistrations} pending
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">No pending</span>
                )}
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: masjidConfig.primaryColor }}
                >
                  Review
                  <FaArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
          <p className="text-xs text-slate-400 mt-2">
            Share public form path:{" "}
            <code className="bg-slate-100 px-1 rounded">/register</code>
          </p>
        </section>

        {/* Quick payment */}
        <section className="mb-8">
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full text-left bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
          >
            <div
              className="h-1 w-full"
              style={{ backgroundColor: masjidConfig.primaryColor }}
            />
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                  style={{
                    backgroundColor: `${masjidConfig.primaryColor}18`,
                    color: masjidConfig.primaryColor,
                  }}
                >
                  <FaCreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Quick Payment
                  </h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Record a payment by customer ID or reference number
                  </p>
                </div>
              </div>
              <span
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shrink-0 sm:ml-4 group-hover:opacity-95 transition-opacity"
                style={{ backgroundColor: masjidConfig.primaryColor }}
              >
                Make Payment
                <FaArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        </section>

        {/* Stats */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <AnalyticsCard
              name="Total Areas"
              amount={areaData?.length || 0}
              icon={<FaMapMarkedAlt className="h-5 w-5" />}
              accentColor={masjidConfig.primaryColor}
            />
            <AnalyticsCard
              name="Total Members"
              amount={userCount || 0}
              icon={<FaUsers className="h-5 w-5" />}
              accentColor="#0d9488"
            />
            <AnalyticsCard
              name={`${currentDay} Collection`}
              amount={todayCollection}
              icon={<FaMoneyBillWave className="h-5 w-5" />}
              isCurrency
              accentColor="#d97706"
            />
            <AnalyticsCard
              name={`${currentMonth} Collection`}
              amount={monthCollection}
              icon={<FaMoneyBillWave className="h-5 w-5" />}
              isCurrency
              accentColor={masjidConfig.primaryDark}
            />
          </div>
        </section>

        {/* Areas */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Areas
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Select an area to manage members and collections
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!areasLoading && areaData.length > 0 ? (
                <span className="text-sm font-medium text-slate-500 tabular-nums">
                  {areaData.length} total
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setIsImportAreasOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:opacity-95 transition-opacity"
                style={{ backgroundColor: masjidConfig.primaryColor }}
              >
                + Add / Import Areas
              </button>
            </div>
          </div>

          {areasLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="skeleton h-[120px] rounded-xl bg-slate-200/60"
                />
              ))}
            </div>
          ) : areaData.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <FaMapMarkedAlt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No areas yet</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">
                Import from CSV/Excel or add areas manually with IDs like MSM-FR.
              </p>
              <button
                type="button"
                onClick={() => setIsImportAreasOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: masjidConfig.primaryColor }}
              >
                + Add / Import Areas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {areaData.map((area: AreaType) => (
                <AreaCard
                  key={area.areaId}
                  name={area.shortName}
                  areaId={area.areaId}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <CentralizedPayment
        isModalOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
      <ImportAreas
        isOpen={isImportAreasOpen}
        onClose={() => setIsImportAreasOpen(false)}
      />
    </div>
  );
};

export default Home;
