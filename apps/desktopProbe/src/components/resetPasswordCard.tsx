import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Icons } from './icons';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';

// Schema definition for form validation using Zod
const schema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof schema>;

export function ResetPasswordCard({
  isSubmitting,
  onChangePassword,
}: {
  isSubmitting: boolean;
  onChangePassword: (params: { password: string }) => void;
}) {
  // Initialize form handling with react-hook-form and Zod for schema validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
    },
    mode: 'onChange',
    disabled: isSubmitting,
  });

  const onSubmit = (values: LoginFormValues) => {
    if (values.password) {
      onChangePassword({ password: values.password });
    }
  };

  return (
    <Card className="w-80 space-y-2.5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl tracking-wide">Reset password</CardTitle>
        <CardDescription className="text-center">
          Enter your new password below, maybe one that you can remember this time :)
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-2.5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>New Password</FormLabel>
                  <FormControl className="flex gap-2">
                    <Input id="password" type="password" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-7 pt-2">
            <Button className="w-full" disabled={!form.formState.isValid}>
              {isSubmitting ? (
                <>
                  <Icons.spinner2 className="mr-1 h-4 w-4 animate-spin" />
                  Changing password
                </>
              ) : (
                'Change password'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
