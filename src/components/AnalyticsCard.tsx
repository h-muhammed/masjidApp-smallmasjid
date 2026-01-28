import React from "react";

interface Props {
  name: string;
  amount: number;
  icon: React.ReactNode;
  isCurrency?: boolean; // Optional prop to toggle currency display
  isPercentage?: boolean; // Optional prop to toggle percentage display
  bgColor: string; // Background color for the card
}

const AnalyticsCard = ({
  name,
  amount,
  icon,
  isCurrency = false,
  isPercentage = false,
  bgColor,
}: Props) => {
  const formatAmount = () => {
    if (isCurrency) {
      return `Rs. ${amount.toLocaleString()}`;
    }
    if (isPercentage) {
      return `${amount}%`;
    }
    return amount.toLocaleString();
  };

  return (
    <div
      className={`shadow-md flex items-center justify-between rounded-lg p-6 w-80 transform transition-transform duration-200 hover:scale-105`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-right">
        <p className="text-lg font-semibold text-white">{name}</p>
        <p className="text-xl font-bold text-white">{formatAmount()}</p>
      </div>
    </div>
  );
};

export default AnalyticsCard;
