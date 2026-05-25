import React from "react";

interface Props {
  name: string;
  amount: number;
  icon: React.ReactNode;
  isCurrency?: boolean;
  isPercentage?: boolean;
  accentColor: string;
}

const AnalyticsCard = ({
  name,
  amount,
  icon,
  isCurrency = false,
  isPercentage = false,
  accentColor,
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
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md transition-shadow duration-200 h-full">
      <div
        className="inline-flex items-center justify-center w-11 h-11 rounded-lg mb-4"
        style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500 leading-snug">{name}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
        {formatAmount()}
      </p>
    </div>
  );
};

export default AnalyticsCard;
