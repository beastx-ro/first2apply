import { useForm } from "react-hook-form"

import { Button } from "../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Input } from "../components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "../components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as z from "zod"

// Schema definition for form validation using Zod
const schema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
})

type LoginFormValues = z.infer<typeof schema>

export interface LoginCardProps {
  onLoginWithEmail: (params: { email: string; password: string }) => void
  isSubmitting: boolean
  /** Render a link/button for "Sign up". If omitted, the sign-up prompt is hidden. */
  signUpLink?: React.ReactNode
  /** Render a link/button for "Forgot password". If omitted, the link is hidden. */
  forgotPasswordLink?: React.ReactNode
}

export function LoginCard({
  onLoginWithEmail,
  isSubmitting,
  signUpLink,
  forgotPasswordLink,
}: LoginCardProps) {
  // Initialize form handling with react-hook-form and Zod for schema validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
    disabled: isSubmitting,
  })

  const onSubmit = (values: LoginFormValues) => {
    // Check if email and password are present
    if (values.email && values.password) {
      onLoginWithEmail({ email: values.email, password: values.password })
    }
  }

  return (
    <Card className="min-w-80 space-y-2.5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl tracking-wide">
          Log in
        </CardTitle>
        <CardDescription className="text-center">
          {signUpLink && <>Don't have an account? {signUpLink}</>}
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
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
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
          <CardFooter className="flex flex-col gap-4 pb-7 pt-2">
            <Button
              className="w-full"
              disabled={!form.formState.isValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Logging in
                </>
              ) : (
                "Log in"
              )}
            </Button>

            {forgotPasswordLink && (
              <div className="justify-self-end">{forgotPasswordLink}</div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
