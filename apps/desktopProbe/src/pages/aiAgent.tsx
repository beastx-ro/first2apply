import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Icons } from '@/components/icons';
import { useError } from '@/hooks/error';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Switch,
  Textarea,
  useToast,
} from '@first2apply/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { DefaultLayout } from './defaultLayout';

// Schema definition for form validation using Zod
const schema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  llmQuery: z.string().min(10, { message: 'Please provide more details' }),
});
type AiAgentFormValues = z.infer<typeof schema>;

export function AiAgentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { handleError } = useError();

  const [isEmailToggled, setIsEmailToggled] = useState(false);
  const [isZapierToggled, setIsZapierToggled] = useState(false);
  const [isSmsToggled, setIsSmsToggled] = useState(false);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const doStuff = async ({ email }: { email: string }) => {
    try {
      setIsSubmitting(true);

      console.log('🕷️ Scraping Zillow page...');
      await sleep(5000);
      console.log('🤖 Extracting listings (using Ollama local model - llama3.1)');
      await sleep(4000);
      console.log('📦 Parsed 18 properties successfully');
      await sleep(3000);
      console.log('📊 Calculating top 3 most affordable listings...');
      await sleep(3000);
      console.log('💬 Top 3 most affordable (price/sqft):');
      console.log('1. Spacious Loft Studio — $2.71/sqft');
      console.log('2. Cozy 1-Bed in Queens — $2.80/sqft');
      console.log('3. 2-Bedroom Apartment — $2.94/sqft');
      console.log('⚙️ Sending Email …');
      await sleep(1000);
      console.log('⚙️ Sending to Zapier …');
      await sleep(1000);
      console.log('⚙️ Sending SMS …');
      await sleep(1000);
      console.log('✅ Workflow completed in 14.8 seconds.');

      // await sendPasswordResetEmail({ email });
      toast({
        title: '🎉 Workflow complete!',
        description: (
          <div className="space-y-1 leading-relaxed">
            <p>Your AI Agent workflow has finished running successfully.</p>
            <p>
              🚀 All <strong>3 tools</strong> were triggered.
            </p>
            <p className="text-sm text-muted-foreground">⏱️ Took ~15 seconds.</p>
          </div>
        ),
        variant: 'success',
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize form handling with react-hook-form and Zod for schema validation
  const form = useForm<AiAgentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
    // disabled: isSubmitting,
  });

  return (
    <DefaultLayout className="flex flex-col space-y-6 p-6 md:p-10">
      <h1 className="w-fit text-2xl font-medium tracking-wide">AI Agent</h1>

      <Card className="space-y-2.5">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl tracking-wide">Create a new workflow</CardTitle>
          <CardDescription className="text-center">
            Let the AI agent know what you're trying to extract from the page and what to do with it.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(doStuff)} className="space-y-4">
            <CardContent className="space-y-2.5">
              <FormField
                control={form.control}
                name="llmQuery"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>
                      Instruct the LLM what kind of information you want to extract. You can even provide a JSON schema.
                    </FormLabel>
                    <FormControl>
                      <Textarea id="instructions" placeholder="Provide your instructions here..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </form>
        </Form>
      </Card>

      {/* render hard coded tools */}
      <div className="grid grid-cols-3 gap-4">
        <Card key={'email'} className="w-full">
          <CardHeader className="flex w-full flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Email</CardTitle>
            <Switch checked={isEmailToggled} onCheckedChange={setIsEmailToggled} className="ml-auto" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-light">{`Send me an email with the results`}</p>
          </CardContent>
        </Card>

        <Card key={'zapier'} className="w-full">
          <CardHeader className="flex w-full flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Zapier</CardTitle>
            <Switch checked={isZapierToggled} onCheckedChange={setIsZapierToggled} className="ml-auto" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-light">{`Trigger a Zapier workflow with the results`}</p>
          </CardContent>
        </Card>

        <Card key={'sms'} className="w-full">
          <CardHeader className="flex w-full flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">SMS</CardTitle>
            <Switch checked={isSmsToggled} onCheckedChange={setIsSmsToggled} className="ml-auto" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-light">{`Text me a summary of the changes on this page over time`}</p>
          </CardContent>
        </Card>
      </div>

      {/* render submit bar */}
      <div className="flex justify-end">
        <Card key={'email'} className="w-full">
          <CardHeader>
            <CardTitle>Review and Start running</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{`If everything looks good, start this workflow which will run every 2 weeks.`}</p>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-7 pt-2">
            <Button
              className="w-full"
              disabled={isSubmitting}
              onClick={() =>
                doStuff({
                  email: form.getValues('email'),
                })
              }
            >
              {isSubmitting && <Icons.spinner2 className="mr-1 animate-spin" />}
              Create workflow with 3 tools
            </Button>

            <div className="justify-self-end">
              <Link to="/login" className="w-fit text-xs text-muted-foreground">
                Cancel
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* <div className="flex items-center justify-end gap-4">
        <p className="text-base">
          Didn't find what you need? You can send us an email at{' '}
          <a href="mailto:contact@first2apply.com" className="text-primary underline">
            contact@first2apply.com
          </a>
        </p>
      </div> */}
    </DefaultLayout>
  );
}

const TOOL_TYPES = ['zapier', 'email', 'sms', 'calendar', 'webSearch'] as const;
type ToolType = (typeof TOOL_TYPES)[number];
type AgentTool = {
  name: ToolType;
  description: string;
  icon: string;
};
