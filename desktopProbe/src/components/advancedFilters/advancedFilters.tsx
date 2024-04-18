import { zodResolver } from "@hookform/resolvers/zod";
import { BorderWidthIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdvancedFilter } from "../../../../supabase/functions/_shared/types";
import { useError } from "../../hooks/error";
import { useSession } from "../../hooks/session";
import {
  getUserAdvancedFilters,
  upsertAdvancedFilters,
} from "../../lib/electronMainSdk";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { toast } from "../ui/use-toast";
import { FilterManager } from "./filterManager";

export const MAX_INPUT_LENGTH = 50;

export const FIELD_VALUES = {
  SALARY: "salary",
  COMPANY_NAME: "companyName",
} as const;

export const FIELD_VALUES_LOOKUP = {
  [FIELD_VALUES.SALARY]: "Salary",
  [FIELD_VALUES.COMPANY_NAME]: "Company Name",
} as const;

export type FieldValue = (typeof FIELD_VALUES)[keyof typeof FIELD_VALUES];

export const OPERATOR_VALUES = {
  GREATER: "greaterThan",
  LESS: "lessThan",
  INCLUDES: "includes",
  NOT_INCLUDES: "notIncludes",
} as const;

export type OperatorValue =
  (typeof OPERATOR_VALUES)[keyof typeof OPERATOR_VALUES];

export const SALARY_OPERATORS = [OPERATOR_VALUES.GREATER, OPERATOR_VALUES.LESS];
export const COMPANY_NAME_OPERATORS = [
  OPERATOR_VALUES.INCLUDES,
  OPERATOR_VALUES.NOT_INCLUDES,
];

export const OPERATOR_VALUES_LOOKUP = {
  [OPERATOR_VALUES.GREATER]: ">",
  [OPERATOR_VALUES.LESS]: "<",
  [OPERATOR_VALUES.INCLUDES]: "Includes",
  [OPERATOR_VALUES.NOT_INCLUDES]: "Not Includes",
} as const;

export const defaultEmptyRule = {
  field: "",
  operator: "",
  value: "",
};
export const defaultEmptyFilter = {
  filterName: "",
  rules: [defaultEmptyRule],
};

export const defaultFormValue = {
  filters: [defaultEmptyFilter],
};

export type FormRule = {
  field: FieldValue | string;
  operator: OperatorValue | string;
  value: string;
};

export type FormValues = {
  filters: Array<{
    filterName: string;
    rules: FormRule[];
  }>;
};

const salaryRuleSchema = z.object({
  field: z.literal(FIELD_VALUES.SALARY),
  operator: z.enum([OPERATOR_VALUES.GREATER, OPERATOR_VALUES.LESS]),
  value: z.string().refine((value) => /^0$|^[1-9]\d{0,9}$/.test(value), {
    message: "Must be an integer up to 10 digits without leading zeros.",
  }),
});

const companyNameRuleSchema = z.object({
  field: z.literal(FIELD_VALUES.COMPANY_NAME),
  operator: z.enum([OPERATOR_VALUES.INCLUDES, OPERATOR_VALUES.NOT_INCLUDES]),
  value: z.string().min(1, { message: "This field cannot be blank" }).max(50),
});
const ruleSchema = z.union([salaryRuleSchema, companyNameRuleSchema]);

const filterSchema = z.object({
  filterName: z
    .string()
    .min(1, { message: "This field cannot be blank" })
    .max(MAX_INPUT_LENGTH, {
      message: `This field cannot be more than ${MAX_INPUT_LENGTH} characters`,
    }),
  rules: z.array(ruleSchema),
});

const schema = z.object({
  filters: z.array(filterSchema),
});

export function AdvancedFilters() {
  const { isLoggedIn } = useSession();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { filters: [defaultEmptyFilter] },
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { errors, isValid: isValidForm },
    getValues,
    reset,
  } = form;

  const getAllUserAdvancedFilters = async () => {
    try {
      if (!isLoggedIn) return;
      const advancedFilters = await getUserAdvancedFilters();
      reset({ filters: advancedFilters });
      setIsLoading(false);
    } catch (error) {
      handleError({ error });
    }
  };

  useEffect(() => {
    getAllUserAdvancedFilters();
  }, [isLoggedIn]);

  const onSubmit = async (data: { filters: AdvancedFilter[] }) => {
    console.log("SUBMITTING", data);
    const { filters } = data;
    const filledFilters = filters.filter(
      (filter) =>
        filter.filterName &&
        filter.rules.filter((rule) => rule.field && rule.operator && rule.value)
          .length > 0
    );

    const payload: AdvancedFilter[] = filledFilters;

    setIsSubmitting(true);

    try {
      const updatedFilters = await upsertAdvancedFilters(payload);
      toast({
        title: "Success",
        description: "Filters saved successfully!",
        variant: "success",
      });
      if (!updatedFilters) return;
      console.log("Updated Filters", updatedFilters);
      reset({ filters: updatedFilters });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center  mt-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button>
            <BorderWidthIcon className="mr-1" />
            Filters
          </Button>
        </PopoverTrigger>
        <Form {...form}>
          <form>
            <PopoverContent className="w-[600px]" align={"start"}>
              <FilterManager />
              <div className="w-full flex justify-end">
                <Button
                  disabled={!isValidForm || isSubmitting || isLoading}
                  onClick={handleSubmit(onSubmit)}
                >
                  Save
                </Button>
              </div>
            </PopoverContent>
          </form>
        </Form>
      </Popover>
      <div className="ml-4 flex justify-evenly">
        {getValues("filters").length ? (
          <>
            <h3 className="mr-2">Filtered By: </h3>
            {getValues("filters").map((filter, idx) => (
              <Badge key={idx}>{filter.filterName}</Badge>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
