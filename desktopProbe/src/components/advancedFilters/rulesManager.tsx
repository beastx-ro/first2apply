import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import { FormValues, defaultEmptyRule } from "./advancedFilters";
import { FieldSelection } from "./inputButtons/fieldSelection";
import { FilterValueInput } from "./inputButtons/filterValueInput";
import { OperatorSelection } from "./inputButtons/operatorSelection";

export function RulesManager({ filterIdx }: { filterIdx: number }) {
  const { control } = useFormContext<FormValues>();

  const rules = useFieldArray({
    control,
    name: `filters.${filterIdx}.rules`,
  });

  const addNewRule = () => {
    rules.append(defaultEmptyRule);
  };

  const removeRule = ({ ruleIdx }: { ruleIdx: number }) => {
    rules.remove(ruleIdx);
  };

  return (
    <div className="mt-6">
      <h3>Rules</h3>
      {rules.fields.map((_, ruleIdx) => (
        <div className="mt-2">
          <div className="flex items-center mt-1">
            <FieldSelection filterIdx={filterIdx} ruleIdx={ruleIdx} />
            <OperatorSelection filterIdx={filterIdx} ruleIdx={ruleIdx} />
            <FilterValueInput filterIdx={filterIdx} ruleIdx={ruleIdx} />
            <div className="flex w-full justify-end">
              <div className="flex items-center">
                <Button
                  className="bg-destructive/60 hover:bg-destructive/40 focus:bg-destructive/40 transition-colors duration-200 ease-in-out
                text-gray-50/70 hover:text-gray-50/90 focus:text-gray-50/90"
                  disabled={rules.fields.length < 2}
                  variant="destructive"
                  onClick={() => removeRule({ ruleIdx })}
                  type="button"
                >
                  <TrashIcon className="h-8" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="mt-2">
        <Button onClick={addNewRule} type="button" className="text-sm ml-1">
          <PlusIcon />
        </Button>
      </div>
    </div>
  );
}
