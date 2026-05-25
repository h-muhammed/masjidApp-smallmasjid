import Link from "next/link";
import React from "react";
import { FaChevronRight } from "react-icons/fa";
import { masjidConfig } from "@/config/masjid";

interface Props {
  name: string;
  areaId: string;
}

const AreaCard = ({ name, areaId }: Props) => {
  return (
    <Link href={`/areas/${areaId}`} className="group block h-full">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 h-full min-h-[120px] flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-200">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: masjidConfig.primaryColor }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-base font-semibold text-slate-800 group-hover:text-slate-900">
            {name}
          </p>
          <FaChevronRight
            className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
};

export default AreaCard;
