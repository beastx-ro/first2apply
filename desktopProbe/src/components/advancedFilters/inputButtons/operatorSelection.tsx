import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  COMPANY_NAME_OPERATORS,
  FIELD_VALUES,
  FormValues,
  OPERATOR_VALUES_LOOKUP,
  SALARY_OPERATORS,
} from "../advancedFilters";

export const OperatorSelection = ({
  filterIdx,
  ruleIdx,
}: {
  filterIdx: number;
  ruleIdx: number;
}) => {
  const { control, watch } = useFormContext<FormValues>();

  const fieldValue = watch(`filters.${filterIdx}.rules.${ruleIdx}.field`);

  if (!fieldValue) return null;

  return (
    <Controller
      control={control}
      name={`filters.${filterIdx}.rules.${ruleIdx}.operator`}
      render={({ field: { onChange, value } }) => (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[140px] h-10 mx-2 ">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {fieldValue === FIELD_VALUES.SALARY
              ? Object.values(SALARY_OPERATORS).map((operatorValue) => (
                  <SelectItem value={operatorValue}>
                    <div className="flex items-center">
                      <div className="flex-1 ml-2">
                        {OPERATOR_VALUES_LOOKUP[operatorValue]}
                      </div>
                    </div>
                  </SelectItem>
                ))
              : Object.values(COMPANY_NAME_OPERATORS).map((operatorValue) => (
                  <SelectItem value={operatorValue}>
                    <div className="flex items-center">
                      <div className="flex-1 ml-2">
                        {OPERATOR_VALUES_LOOKUP[operatorValue]}
                      </div>
                    </div>
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
      )}
    />
  );
};
