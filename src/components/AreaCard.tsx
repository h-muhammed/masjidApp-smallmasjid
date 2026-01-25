import Link from "next/link";
import React from "react";

interface Props {
  name: string;
  areaId: string;
}

const AreaCard = ({ name, areaId }: Props) => {
  return (
    <Link href={`/areas/${areaId}`}>
      <div className="bg-white shadow-lg rounded-lg h-32 w-32 md:h-40 md:w-40 p-4 flex flex-col justify-center items-center transform transition-transform duration-200 hover:scale-105">
        <p className="text-center text-xl md:text-2xl font-medium text-gray-800">{name}</p>
      </div>
    </Link>
  );
};

export default AreaCard;
