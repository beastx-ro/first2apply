import { FC } from "react";
import { Skeleton } from "../ui/skeleton";

export const JobsListSkeleton: FC = () => {
  return (
    <ul className="space-y-8">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="space-y-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-1 grow md:flex-auto">
              {/* Company Name */}
              <Skeleton className="h-3 w-[80px]" />
              {/* Job Title */}
              <Skeleton className="h-4 w-44" />
              {/* Location, JobType & Salary */}
              <Skeleton className="h-6 w-60" />
            </div>
            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-[66px] h-8" /> {/* Apply Button */}
              <Skeleton className="w-[78px] h-8" /> {/* Archive Button */}
            </div>
          </div>
          <Skeleton className="w-full h-px" /> {/* Divider */}
        </li>
      ))}
    </ul>
  );
};
