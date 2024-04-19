import { PlusIcon } from "@radix-ui/react-icons";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import { FormLabel } from "../ui/form";
import { FormValues, defaultEmptyFilter } from "./advancedFilters";
import { FilterNameInput } from "./inputButtons/filterNameInput";
import { RulesManager } from "./rulesManager";
import { v4 as uuid } from "uuid";

export function FilterManager() {
  const { control } = useFormContext<FormValues>();

  // Here, 'filters' is the name used to reference the array in the form state
  const filterArray = useFieldArray({
    control,
    name: "filters", // This must match the key in defaultValues
  });

  const advancedFilters = filterArray.fields;

  const addNewFilter = () => {
    filterArray.append({ ...defaultEmptyFilter, id: uuid() });
  };

  const removeFilter = ({ id }: { id: string }) => {
    filterArray.remove(
      filterArray.fields.findIndex((filter) => filter.id === id)
    );
  };

  return (
    <div>
      {advancedFilters.length ? (
        advancedFilters.map((filter, filterIdx) => (
          <div className="" key={filter.id}>
            <FormLabel>Name</FormLabel>

            <div className="flex items-center">
              <FilterNameInput filterIdx={filterIdx} />
              <div className="w-full flex justify-end">
                <Button
                  className="bg-destructive/60 hover:bg-destructive/40 focus:bg-destructive/40 transition-colors duration-200 ease-in-out
                  text-gray-50/90 hover:text-gray-50/70 focus:text-gray-50/70
                  "
                  variant="destructive"
                  onClick={() => removeFilter({ id: filter.id })}
                >
                  Remove Filter
                </Button>
              </div>
            </div>
            <RulesManager filterIdx={filterIdx} />
            <div className="h-px mt-2 w-full bg-muted" />
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
