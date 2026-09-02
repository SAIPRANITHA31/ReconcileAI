import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="theme-toggle" aria-label="Theme selector">
      {options.map((option) => {
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            className={
              theme === option.value
                ? "theme-option active"
                : "theme-option"
            }
            onClick={() => setTheme(option.value)}
            title={`${option.label} theme`}
            aria-label={`${option.label} theme`}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}