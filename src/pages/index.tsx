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
import LoadingScreen from "@/components/LoadingScreen";
import { AreaType } from "@/types/types";
import { NextPage } from "next";
import { useFirebase } from "@/contexts/firebaseContext";
import { useRouter } from "next/router";
import { FaUsers, FaMapMarkedAlt, FaMoneyBillWave, FaCreditCard } from "react-icons/fa";
import { useEffect, useState } from "react";
import { masjidConfig } from "@/config/masjid";



const fetchUsers = async () => {
  const usersCollection = collection(firestore, "users");
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.length; // Return the total number of users
};

const getCurrentDay = () => {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date()
  );
};

const getCurrentMonth = () => {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date());
};

const Home: NextPage = () => {
  const { data: areaData = [], isLoading: areasLoading } = useGetAreas();
  const { data: userCount, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const { user, loading } = useFirebase();
  const router = useRouter();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [todayCollection, setTodayCollection] = useState(0);
  const [monthCollection, setMonthCollection] = useState(0);
  const [collectionsLoading, setCollectionsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCollectionsLoading(true);
        //const currentYear = new Date().getFullYear(); // Get the current year dynamically
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

  // Show loading screen while fetching all dashboard data
  if (loading || usersLoading || areasLoading || collectionsLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const currentDay = getCurrentDay();
  const currentMonth = getCurrentMonth();

  // Prepare chart data

  return (
    <>
      {/* Centralized Payment Card */}
      <div className="p-4 md:p-5">
        <div 
          className="card bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all"
          onClick={() => setIsPaymentModalOpen(true)}
        >
          <div className="card-body p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-white bg-opacity-20 rounded-full p-3 md:p-4">
                  <FaCreditCard className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <div>
                  <h2 className="card-title text-xl md:text-2xl">Quick Payment</h2>
                  <p className="text-white text-opacity-90 text-sm md:text-base">Enter customer ID and pay for any month</p>
                </div>
              </div>
              <button className="btn btn-md md:btn-lg btn-outline btn-white w-full md:w-auto">
                Make Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-5">
        <AnalyticsCard
          name="Total Areas"
          amount={areaData?.length || 0}
          icon={<FaMapMarkedAlt className="h-8 w-8 text-white" />}
          bgColor={masjidConfig.primaryColor}
        />
        <AnalyticsCard
          name="Total Users"
          amount={userCount || 0}
          icon={<FaUsers className="h-8 w-8 text-white" />}
          bgColor="#28A745" // Match color for "Users"
        />
        <AnalyticsCard
          name={`${currentDay} Collection`}
          amount={todayCollection}
          icon={<FaMoneyBillWave className="h-8 w-8 text-white" />}
          isCurrency={true}
          bgColor="#FFC107"
        />
        <AnalyticsCard
          name={`${currentMonth} Collection`}
          amount={monthCollection}
          icon={<FaMoneyBillWave className="h-8 w-8 text-white" />}
          isCurrency={true}
          bgColor="#6F42C1"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-10">
        {areasLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="skeleton rounded-xl h-24 w-24 md:h-48 md:w-48"
              ></div>
            ))
          : areaData?.map((area: AreaType) => (
              <AreaCard
                key={area.areaId}
                name={area.shortName}
                areaId={area.areaId}
              />
            ))}
      </div>
      
      {/* Centralized Payment Modal */}
      <CentralizedPayment
        isModalOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </>
  );
};

export default Home;
