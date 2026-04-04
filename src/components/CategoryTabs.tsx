import { CheckSquare, Lightbulb, Bell, StickyNote } from "lucide-react";
import type { Category } from "@/hooks/useBrainDump";

interface CategoryTabsProps {
  active: Category;
  onChange: (cat: Category) => void;
  counts: Record<Category, number>;
}

const tabs: { key: Category; label: string; icon: React.ElementType }[] = [
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "ideas", label: "Ideas", icon: Lightbulb },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "notes", label: "Notes", icon: StickyNote },
];

const CategoryTabs = ({ active, onChange, counts }: CategoryTabsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
            transition-all duration-300 whitespace-nowrap
            ${active === key
              ? "tab-active text-neon-cyan"
              : "glass-card text-muted-foreground hover:text-foreground hover:border-neon-cyan/20"
            }
          `}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
          {counts[key] > 0 && (
            <span className={`
              text-xs px-1.5 py-0.5 rounded-full mono
              ${active === key
                ? "bg-neon-cyan/20 text-neon-cyan"
                : "bg-muted text-muted-foreground"
              }
            `}>
              {counts[key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
