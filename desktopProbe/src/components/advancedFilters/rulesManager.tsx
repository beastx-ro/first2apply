import { useFieldArray, useFormContext } from "react-hook-form";
import { FilterRule } from "../../../../supabase/functions/_shared/types";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { FormRule, FormValues, defaultEmptyRule } from "./advancedFilters";
import { FieldSelection } from "./inputButtons/fieldSelection";
import { FilterValueInput } from "./inputButtons/filterValueInput";
import { OperatorSelection } from "./inputButtons/operatorSelection";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";

export function RulesManager({ filterIdx }: { filterIdx: number }) {
  const { control } = useFormContext<FormValues>();

  const rules = useFieldArray({
    control,
    name: `filters.${filterIdx}.rules`,
  });

  const addNewRule = () => {
    console.log("adding new rule", rules);
    rules.append(defaultEmptyRule);
  };

  const removeRule = ({ ruleIdx }: { ruleIdx: number }) => {
    rules.remove(ruleIdx);
  };

  const isValid = true;

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
              <Button
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
      ))}
      {isValid && (
        <div className="mt-6">
          <Button onClick={addNewRule} type="button" className="text-sm">
            <PlusIcon className="mr-1" />
            Add rule
          </Button>
        </div>
      )}
    </div>
  );
}
