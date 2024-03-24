import { BorderWidthIcon } from "@radix-ui/react-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { useState } from "react";
import { AdvancedFilter } from "../../../supabase/functions/_shared/types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import { useSession } from "../hooks/session";
import { useError } from "../hooks/error";
import { toast } from "./ui/use-toast";

const schema = z.object({
  name: z.string().min(1, { message: "This field cannot be blank" }).max(50),
  rules: z.array(
    z.object({
      field: z.string().min(1, { message: "This field cannot be blank" }),
      operator: z.string().min(1, { message: "This field cannot be blank" }),
      value: z.string().min(1, { message: "This field cannot be blank" }),
    })
  ),
});

type FormValues = z.infer<typeof schema>;

export default function AdvancedFilter({
  onCreateAdvabcedFilter,
}: {
  onCreateAdvabcedFilter: (filter: AdvancedFilter) => void;
}) {
  const { isLoggedIn } = useSession();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState<AdvancedFilter>({
    name: "",
    rules: [],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      rules: [],
    },
    mode: "onChange",
  });

  const onSubmit = async (values: FormValues) => {
    const { name, rules } = values;
    if (!name || !rules.length) return;

    setIsSubmitting(true);

    try {
      // await createReview({ title, description, rating });
      // await fetchUserReview();
      form.reset();
      toast({
        title: "Success",
        description: "Review submitted successfully!",
        variant: "success",
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>
            <BorderWidthIcon className="mr-1" />
            Filter
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add your custom filters</AlertDialogTitle>
            <AlertDialogDescription>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="w-full mt-6">
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input id="name" type="name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onCreateAdvabcedFilter(filter)}
            >
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
