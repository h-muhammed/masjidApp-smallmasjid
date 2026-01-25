import React from "react";

interface Props {
  name: string;
  amount: number;
  icon: React.ReactNode;
  isCurrency?: boolean; // Optional prop to toggle currency display
  bgColor: string; // Background color for the card
}

const AnalyticsCard = ({ name, amount, icon, isCurrency = false, bgColor }: Props) => {
  return (
    <div
      className={`shadow-md flex items-center justify-between rounded-lg p-6 w-80 transform transition-transform duration-200 hover:scale-105`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-right">
        <p className="text-lg font-semibold text-white">{name}</p>
        <p className="text-xl font-bold text-white">
          {isCurrency ? `Rs. ${amount}` : amount}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsCard;
