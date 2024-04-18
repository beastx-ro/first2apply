import { Controller, useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  FIELD_VALUES,
  FIELD_VALUES_LOOKUP,
  FieldValue,
} from "../advancedFilters";

export const FieldSelection = ({
  filterIdx,
  ruleIdx,
}: {
  filterIdx: number;
  ruleIdx: number;
}) => {
  const { control, watch, setValue } = useFormContext();
  const pathPrefix = `filters.${filterIdx}.rules.${ruleIdx}`;
  const filterNameValue = watch(`filterName`);

  const resetOperatorAndValue = () => {
    // Reset the operator and value when the field changes
    setValue(`${pathPrefix}.operator`, "", {
      shouldValidate: true,
    });
    setValue(`${pathPrefix}.value`, "", {
      shouldValidate: true,
    });
  };

  const onFieldChange = (fieldValue: FieldValue) => {
    setValue(`${pathPrefix}.field`, fieldValue, { shouldValidate: true });
    resetOperatorAndValue();
  };

  return (
    <Controller
      control={control}
      name={`${pathPrefix}.field`}
      render={({ field: { onChange, value } }) => (
        <Select value={value} onValueChange={onFieldChange}>
          <SelectTrigger className="w-[152px] h-10">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(FIELD_VALUES).map((fieldValue) => (
              <SelectItem value={fieldValue}>
                <div className="flex items-center">
                  <div className="flex-1 ml-2">
                    {FIELD_VALUES_LOOKUP[fieldValue]}
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
