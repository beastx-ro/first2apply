import { Item } from '@radix-ui/react-radio-group';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Review } from '@first2apply/core';
import { Card, CardContent, CardHeader } from '@first2apply/ui';
import { RadioGroup } from '@first2apply/ui';
import { Button } from '@first2apply/ui';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@first2apply/ui';
import { Input } from '@first2apply/ui';
import { Skeleton } from '@first2apply/ui';
import { Textarea } from '@first2apply/ui';
import { toast } from '@first2apply/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Icons } from '../components/icons';
import { useError } from '../hooks/error';
import { createReview, getOS, getUserReview, openExternalUrl, updateReview } from '../lib/electronMainSdk';
import { DefaultLayout } from './defaultLayout';

const MICROSOFT_APP_URL = 'ms-windows-store://pdp/?productid=9NK18WV87SV2';

const StarIcon = ({ filled = false }) => (
  <svg
    className={`h-6 w-6 ${filled ? 'text-primary' : 'text-border'} transition-colors`}
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M12 .587l3.668 7.431 8.332 1.21-6.001 5.852 1.416 8.254L12 18.896l-7.415 3.898 1.416-8.254-6.001-5.852 8.332-1.21L12 .587z" />
  </svg>
);

const schema = z.object({
  title: z.string().min(1, { message: 'This field cannot be blank' }).max(80),
  description: z.string().min(1, { message: 'This field cannot be blank' }).max(500).optional(),
  rating: z.number().min(1, { message: 'Rate from 1 to 5 stars' }).max(5),
});

type FormValues = z.infer<typeof schema>;

export function FeedbackPage() {
  const { handleError } = useError();

  const [isLoading, setIsLoading] = useState(true);
  const [userOS, setUserOS] = useState<NodeJS.Platform | ''>('');
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [hoveredValue, setHoveredValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      rating: 5,
    },
    mode: 'onChange',
  });

  /**
   * Load user review on mount, if it exists.
   * Also load the user's OS to display a CTA for Windows users.
   */
  useEffect(() => {
    const fetchUserReview = async () => {
      try {
        // check if user has already reviewed and load the form accordingly
        const existingReview = await getUserReview();
        if (existingReview) {
          form.setValue('title', existingReview.title);
          form.setValue('description', existingReview.description);
          form.setValue('rating', existingReview.rating);
        }
        setExistingReview(existingReview);

        // load user's OS
        const userOS = await getOS();
        setUserOS(userOS);
        setIsLoading(false);
      } catch (error) {
        handleError({ error });
      }
    };

    fetchUserReview();
  }, []);

  const { setValue, watch } = form;
  const rating = watch('rating'); // This will update the rating based on the form's current value

  /**
   * Submit the review form.
   */
  const onSubmit = async (values: FormValues) => {
    try {
      const { title, description, rating } = values;
      if (!title || !rating) return;

      setIsSubmitting(true);
      let updatedReview = existingReview;
      if (!existingReview) {
        updatedReview = await createReview({ title, description, rating });
      } else {
        updatedReview = await updateReview({
          id: existingReview.id,
          title,
          description,
          rating,
        });
      }
      setExistingReview(updatedReview);

      toast({
        title: 'Thank you for making First 2 Apply better!',
        description:
          'Your feedback has been submitted and our team will review it soon. You can always update your review later.',
        variant: 'success',
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Open the Windows Store page in the Store app.
   */
  const openWindowsStore = () => {
    openExternalUrl(MICROSOFT_APP_URL);
  };

  if (isLoading) {
    return (
      <DefaultLayout className="space-y-3 p-6 md:p-10">
        <Skeleton className="mb-4 h-4 w-full" />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="space-y-3 p-6 md:p-10">
      <h1 className="pb-3 text-2xl font-medium tracking-wide">Feedback</h1>

      <Card className="rounded-lg">
        <CardHeader>
          <h2 className="text-xl font-medium">Help us make First 2 Apply better</h2>
          <p className="text-balance text-sm text-muted-foreground">
            Let us know what works, what doesn't or any ideas you might have that would make the app better suited to
            your job hunting needs.
          </p>
          {userOS === 'win32' && (
            <p className="my-2 text-balance text-sm text-muted-foreground">
              If you're enjoying First 2 Apply, please consider leaving a review on the{' '}
              <a
                className="hover:text-primary-dark text-primary underline hover:cursor-pointer hover:no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  openWindowsStore();
                }}
              >
                Microsoft Store
              </a>
              .
            </p>
          )}
        </CardHeader>

        <CardContent className="py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={() => (
                  <FormItem className="w-full">
                    <FormControl>
                      <RadioGroup
                        value={String(rating)}
                        onValueChange={(value) => setValue('rating', Number(value))}
                        className="flex items-center"
                      >
                        {Array.from({ length: 5 }, (_, index) => {
                          const value = index + 1;
                          return (
                            <Item
                              key={value}
                              value={String(value)}
                              onMouseEnter={() => setHoveredValue(value)}
                              onMouseLeave={() => setHoveredValue(0)}
                            >
                              <label className="cursor-pointer">
                                <StarIcon filled={value <= (hoveredValue || rating)} />
                              </label>
                            </Item>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input id="title" type="title" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>
                      Description <i>(Optional)</i>
                    </FormLabel>
                    <FormControl>
                      <Textarea id="description" className="mb-4 resize-none" rows={6} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={!form.formState.isValid || isSubmitting} size="lg" className="text-base">
                {isSubmitting ? (
                  <>
                    <Icons.spinner2 className="h-4 w-4 animate-spin" />
                    Submitting review...
                  </>
                ) : existingReview ? (
                  'Update review'
                ) : (
                  'Submit review'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DefaultLayout>
  );
}
