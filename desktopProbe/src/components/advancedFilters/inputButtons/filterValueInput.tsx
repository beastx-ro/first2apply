import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormControl, FormItem } from "../../ui/form";
import { Input } from "../../ui/input";
import { FIELD_VALUES } from "../advancedFilters";

export const FilterValueInput = ({
  filterIdx,
  ruleIdx,
}: {
  filterIdx: number;
  ruleIdx: number;
}) => {
  const {
    control,
    watch,
    setValue,
    getValues,
    register,
    formState: { errors },
  } = useFormContext();

  const pathPrefix = `filters.${filterIdx}.rules.${ruleIdx}`;

  const valueName = `${pathPrefix}.value`;
  const selectedField = watch(`${pathPrefix}.field`);
  const selectedOperator = watch(`${pathPrefix}.operator`);

  const isSalary = selectedOperator && selectedField === FIELD_VALUES.SALARY;
  const isCompanyName =
    selectedOperator && selectedField === FIELD_VALUES.COMPANY_NAME;

  // Local state for managing the display value
  const [displayValue, setDisplayValue] = useState("");

  // Update displayValue when the field changes
  useEffect(() => {
    if (selectedField === FIELD_VALUES.SALARY) {
      // Re-format the display value when the field changes
      const currentVal = getValues(valueName);
      setDisplayValue(formatValue(currentVal)); // formatValue needs to be defined to format the string
    }
  }, [selectedField, ruleIdx, setValue]);

  // Function to format the input value with spaces every 3 digits
  const formatValue = (value: string) => {
    const numericValue = value.replace(/\D+/g, ""); // Remove non-numeric characters
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return formattedValue;
  };

  // Handle real-time changes to input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D+/g, "");
    if (rawValue.length <= 10) {
      const formattedValue = formatValue(rawValue);
      setDisplayValue(formattedValue); // Update local state for display
      setValue(valueName, rawValue, { shouldValidate: true }); // Update form state with raw value
    }
  };

  return (
    <Controller
      control={control}
      name={valueName}
      render={() => (
        <div>
          <div className="min-w-40">
            {isSalary ? (
              <FormItem className="w-full">
                <Input
                  value={displayValue} // Use local state for input value
                  onChange={handleInputChange} // Use the custom onChange handler
                  id={FIELD_VALUES.SALARY}
                  type="text"
                  // Prevents entering non-integer values (e.g., decimals, e)
                  onKeyDown={(e) =>
                    ["e", "E", "+", "-", "."].includes(e.key) &&
                    e.preventDefault()
                  }
                />
                {errors.filterName && <p>{`${errors.filterName.message}`}</p>}
              </FormItem>
            ) : isCompanyName ? (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    id={FIELD_VALUES.COMPANY_NAME}
                    type="text"
                    {...register(valueName)}
                  />
                </FormControl>
              </FormItem>
            ) : null}
          </div>
        </div>
      )}
    />
  );
};
