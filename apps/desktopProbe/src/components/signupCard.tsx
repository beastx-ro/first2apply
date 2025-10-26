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
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupFormValues = z.infer<typeof schema>;

export function SignupCard({
  onSignupWithEmail,
  isSubmitting,
}: {
  onSignupWithEmail: (params: { email: string; password: string }) => void;
  isSubmitting: boolean;
}) {
  // Initialize form handling with react-hook-form and Zod for schema validation
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
    disabled: isSubmitting,
  });

  const onSubmit = (values: SignupFormValues) => {
    // Check if email and password are present
    if (values.email && values.password) {
      onSignupWithEmail({ email: values.email, password: values.password });
    }
  };

  return (
    <Card className="min-w-80 space-y-2.5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl tracking-wide">Sign up</CardTitle>
        <CardDescription className="text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-2.5">
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input id="email" type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Password</FormLabel>
                  <FormControl className="flex gap-2">
                    <Input id="password" type="password" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="pb-[68px] pt-2">
            <Button className="w-full" disabled={!form.formState.isValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icons.spinner2 className="mr-1 h-4 w-4 animate-spin" />
                  Signing up
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
