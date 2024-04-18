import { Controller, useFormContext } from "react-hook-form";
import { FormItem, FormLabel } from "../../ui/form";
import { Input } from "../../ui/input";
import { FormValues, MAX_INPUT_LENGTH } from "../advancedFilters";

export const FilterNameInput = ({ filterIdx }: { filterIdx: number }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const error = errors.filters?.[filterIdx]?.filterName
    ? errors.filters[filterIdx].filterName.message
    : null;

  return (
    <Controller
      control={control}
      name={`filters.${filterIdx}.filterName`}
      render={({ field }) => (
        <div className="">
          <FormItem className="mt-2">
            <Input
              className="w-[300px]"
              placeholder="Filter name..."
              id="filterName"
              type="filterName"
              maxLength={MAX_INPUT_LENGTH}
              value={field.value}
              {...field}
            />
            {error && <p>{`${error}`}</p>}
          </FormItem>
        </div>
      )}
    />
  );
};
