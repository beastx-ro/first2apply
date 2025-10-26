import { Button } from '@first2apply/ui';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@first2apply/ui';
import { Input } from '@first2apply/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import * as z from 'zod';

import { Icons } from './icons';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@first2apply/ui';

// Schema definition for form validation using Zod
const schema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

type LoginFormValues = z.infer<typeof schema>;

export function ForgotPasswordCard({
  isSubmitting,
  onResetPassword,
}: {
  isSubmitting: boolean;
  onResetPassword: (params: { email: string }) => void;
}) {
  // Initialize form handling with react-hook-form and Zod for schema validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
    disabled: isSubmitting,
  });

  const onSubmit = (values: LoginFormValues) => {
    if (values.email) {
      onResetPassword({ email: values.email });
    }
  };

  return (
    <Card className="w-80 space-y-2.5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl tracking-wide">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we will send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-2.5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input id="email" type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-7 pt-2">
            <Button className="w-full" disabled={!form.formState.isValid}>
              {isSubmitting && <Icons.spinner2 className="mr-1 animate-spin" />}
              Send Reset Link
            </Button>

            <div className="justify-self-end">
              <Link to="/login" className="text-muted-foreground w-fit text-xs">
                Back to login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
