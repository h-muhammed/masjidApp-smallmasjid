import { useRouter } from "next/router";
import React from "react";

interface Props {
  className?: string;
}

const GoBackButton = ({ className }: Props) => {
  const router = useRouter();
  return (
    <div>
      <button
        className={`btn btn-circle ${className}`}
        onClick={() => router.back()}
      >
        <svg
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
          fill="#000000"
          className="h-6 w-6"
        >
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            <path
              fill="#000000"
              d="M609.408 149.376 277.76 489.6a32 32 0 0 0 0 44.672l331.648 340.352a29.12 29.12 0 0 0 41.728 0 30.592 30.592 0 0 0 0-42.752L339.264 511.936l311.872-319.872a30.592 30.592 0 0 0 0-42.688 29.12 29.12 0 0 0-41.728 0z"
            ></path>
          </g>
        </svg>
      </button>
    </div>
  );
};

export default GoBackButton;
