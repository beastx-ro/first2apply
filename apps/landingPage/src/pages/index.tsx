import { AdvancedMatchingSection } from '@/components/advancedMatchingSection';
import { AlertsSection } from '@/components/alertsSection';
import { BenefitsSection } from '@/components/benefitsSection';
import { BottomCta } from '@/components/bottomCta';
import { DefaultLayout } from '@/components/defaultLayout';
import { ExplainerSection } from '@/components/explainerSection';
import { Faqs } from '@/components/faqs';
import { FeedbackSection } from '@/components/feedbackSection';
import { F2aHead } from '@/components/head';
import { OrganizationSection } from '@/components/organizationSection';
import { PricingSection } from '@/components/pricingSection';
import { ProductSection } from '@/components/productSection';

export default function Home() {
  return (
    <>
      <F2aHead
        title="First 2 Apply - New job alerts from 10+ most popular sites"
        description="Land more interviews by being the first to know when new jobs are posted. Stop wasting time manually browsing LinkedIn, Indeed, Dice or other job boards."
        path="/"
      />

      <DefaultLayout>
        <ProductSection />
        <ExplainerSection />
        <BenefitsSection />
        <AdvancedMatchingSection />
        <AlertsSection />
        <OrganizationSection />
        <BottomCta />
        <FeedbackSection />
        <PricingSection />
        <Faqs />
      </DefaultLayout>
    </>
  );
}
