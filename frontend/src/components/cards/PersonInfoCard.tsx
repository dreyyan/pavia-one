import React from "react";
import { Adviser } from "../../types";

interface PersonInfoCardProps {
  title: string;
  person?: Adviser | null;
}

const PersonInfoCard: React.FC<PersonInfoCardProps> = ({ title, person }) => {
  return (
    <div className="bg-[var(--color-bg-100)] rounded-lg p-4">
      <span className="form-section-title">
        {title}
      </span>

      {person ? (
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-[var(--color-bg-200)] flex items-center justify-center text-[var(--color-text-700)] font-bold text-sm flex-shrink-0">
            {person.name
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-roboto font-medium text-[var(--color-text-900)]">
              {person.name}
            </span>
            <span className="text-xs font-mono text-[var(--color-text-500)]">
              #{person.adviserId}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm font-roboto text-[var(--color-text-600)]">
          No {title.toLowerCase()} assigned
        </p>
      )}
    </div>
  );
};

export default PersonInfoCard;