import { PlusIcon } from "@radix-ui/react-icons";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import { FormLabel } from "../ui/form";
import { FormValues, defaultEmptyFilter } from "./advancedFilters";
import { FilterNameInput } from "./inputButtons/filterNameInput";
import { RulesManager } from "./rulesManager";

export function FilterManager() {
  const { control } = useFormContext<FormValues>();

  // Here, 'filters' is the name used to reference the array in the form state
  const filterArray = useFieldArray({
    control,
    name: "filters", // This must match the key in defaultValues
  });

  const advancedFilters = filterArray.fields;

  const addNewFilter = () => {
    filterArray.append(defaultEmptyFilter);
  };

  const removeFilter = ({ filterIdx }: { filterIdx: number }) => {
    filterArray.remove(filterIdx);
  };

  return (
    <div>
      {advancedFilters.length ? (
        advancedFilters.map((_, filterIdx) => (
          <div className="" key={filterIdx}>
            <FormLabel>Name</FormLabel>

            <div className="flex items-center">
              <FilterNameInput filterIdx={filterIdx} />
              <div className="w-full flex justify-end">
                <Button
                  variant="destructive"
                  onClick={() => removeFilter({ filterIdx })}
                >
                  Remove Filter
                </Button>
              </div>
            </div>
            <RulesManager filterIdx={filterIdx} />
          </div>
        ))
      ) : (
        <div>
          <p className="text-md text-muted-foreground">
            No filters applied to this view
          </p>
          <p className="text-sm text-muted-foreground">
            Add a column below to filter the view
          </p>
        </div>
      )}
      <div className="w-full flex justify-between mt-2">
        <Button onClick={() => addNewFilter()}>
          <PlusIcon className="mr-1" />
          Add Filter
        </Button>
      </div>
    </div>
  );
}
