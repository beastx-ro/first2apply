import { Button, ButtonProps } from "../../ui/button";

// Extend the ButtonProps with your custom prop(s)
interface CustomButtonProps extends ButtonProps {
  isSelected?: boolean;
}

export const SelectorButton: React.FC<CustomButtonProps> = ({
  isSelected,
  children,
  ...props
}) => {
  const selectedClass = isSelected
    ? "border-primary"
    : "border-gray-500 text-gray-500";

  return (
    <Button
      {...props}
      type="button"
      className={`bg-gray-800 hover:bg-gray-700 border-2 ${selectedClass}
       text-sm transition-colors
      `}
    >
      {children}
    </Button>
  );
};
